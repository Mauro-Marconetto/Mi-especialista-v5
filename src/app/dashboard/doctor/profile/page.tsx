
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User as FirebaseUser, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { User, Clock, Landmark, AlertTriangle, Send, CheckCircle, Save } from "lucide-react";
import { DoctorProfileForm } from "@/components/doctor/DoctorProfileForm";
import { AvailabilityManager } from "@/components/doctor/AvailabilityManager";
import { BillingInfoForm } from "@/components/doctor/BillingInfoForm";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// --- Zod Schemas ---
const professionalEntrySchema = z.object({
  specialty: z.string().min(1, "La especialidad es requerida."),
  license: z.string().min(1, "El número de matrícula no puede estar vacío."),
});

const valueSchema = z.object({ value: z.string().min(1, "Este campo no puede estar vacío.") });

const languageLevelEnum = z.enum(["Básico", "Intermedio", "Avanzado", "Bilingüe", "Nativo"], { required_error: "Selecciona un nivel." });
const languageSchema = z.object({
  language: z.string().min(1, "El idioma es requerido."),
  level: languageLevelEnum,
});

const timeSlotSchema = z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM requerido"),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM requerido"),
}).refine(data => data.start < data.end, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end"],
});

const daySchema = z.object({
  enabled: z.boolean(),
  slots: z.array(timeSlotSchema),
});

const combinedProfileSchema = z.object({
  // DoctorProfileForm fields
  title: z.enum(["Dr.", "Dra."], { required_error: "Selecciona un título." }),
  displayName: z.string().min(1, "El nombre y apellido son requeridos."),
  dni: z.string().regex(/^[0-9]{7,8}$/, "El DNI debe tener entre 7 y 8 números."),
  phone: z.string().min(1, "El teléfono es requerido."),
  province: z.string().min(1, "La provincia es requerida."),
  photoURL: z.string().url({ message: "Por favor, ingresa una URL válida." }).or(z.literal('')).optional(),
  professionalEntries: z.array(professionalEntrySchema).min(1, "Debes agregar al menos una especialidad y matrícula."),
  price: z.coerce.number().min(1, "El precio es requerido y debe ser mayor a 0."),
  bio: z.string().optional(),
  experience: z.array(valueSchema).optional(),
  education: z.array(valueSchema).optional(),
  languages: z.array(languageSchema).optional(),
  insurances: z.array(z.string()).optional(),
  
  // AvailabilityManager fields
  appointmentDuration: z.coerce.number().min(10, "La duración debe ser de al menos 10 min.").max(120, "La duración no puede exceder los 120 min.").optional(),
  weeklyAvailability: z.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  }),
  
  // BillingInfoForm fields
  billingInfo: z.object({
      type: z.enum(['cbu', 'alias'], { required_error: "Debes seleccionar un método de pago." }),
      value: z.string().min(1, 'El valor es requerido.'),
  }).optional(),
}).refine((data) => {
    if (data.billingInfo?.type === 'cbu') return /^\d{22}$/.test(data.billingInfo.value);
    return true;
  }, {
    message: "El CBU debe contener 22 dígitos numéricos.",
    path: ["billingInfo", "value"],
})
.refine((data) => {
    if (data.billingInfo?.type === 'alias') return /^[a-zA-Z0-9.]{3,20}$/.test(data.billingInfo.value);
    return true;
  }, {
    message: "El Alias debe tener entre 3 y 20 caracteres (letras, números y puntos).",
    path: ["billingInfo", "value"],
});

type CombinedProfileFormValues = z.infer<typeof combinedProfileSchema>;

const CRITICAL_FIELDS: (keyof CombinedProfileFormValues)[] = ['displayName', 'dni', 'province', 'professionalEntries', 'billingInfo'];

const getChangedFields = (originalData: CombinedProfileFormValues | null, currentData: CombinedProfileFormValues): string[] => {
    if (!originalData) return [];
    const changed: string[] = [];
    for (const key of CRITICAL_FIELDS) {
        const originalValue = JSON.stringify(originalData[key]);
        const currentValue = JSON.stringify(currentData[key]);
        if (originalValue !== currentValue) {
            changed.push(key);
        }
    }
    return changed;
};

const defaultValues: CombinedProfileFormValues = {
  title: "Dr.",
  displayName: "",
  dni: "",
  phone: "",
  province: "",
  photoURL: "",
  professionalEntries: [{ specialty: "", license: "" }],
  price: 0,
  bio: "",
  experience: [],
  education: [],
  languages: [],
  insurances: [],
  appointmentDuration: 30,
  weeklyAvailability: {
    monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  },
  billingInfo: { type: 'cbu', value: '' },
};


export default function DoctorProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profileStatus, setProfileStatus] = useState<'incomplete' | 'pending' | 'pending_update' | 'approved' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<CombinedProfileFormValues | null>(null);

  const form = useForm<CombinedProfileFormValues>({
    resolver: zodResolver(combinedProfileSchema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  const { formState: { isDirty, isValid }, watch } = form;
  const watchedValues = watch();

  const fetchData = useCallback(async (currentUser: FirebaseUser) => {
    setIsLoading(true);
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        let combinedData = { ...defaultValues, photoURL: currentUser.photoURL || "" };

        if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            setProfileStatus(firestoreData.status || 'incomplete');

            combinedData = {
                ...combinedData,
                ...firestoreData,
                appointmentDuration: firestoreData.appointmentDuration || 30,
                experience: (firestoreData.experience || []).map((v: string) => ({ value: v })),
                education: (firestoreData.education || []).map((v: string) => ({ value: v })),
                weeklyAvailability: firestoreData.weeklyAvailability || defaultValues.weeklyAvailability,
                billingInfo: firestoreData.billingInfo || defaultValues.billingInfo,
            };
        }
        form.reset(combinedData);
        setOriginalData(combinedData);
    } catch (error) {
        console.error("Error fetching user data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [form]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchData(currentUser);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchData]);

  const isSubmittableForValidation = useMemo(() => {
    return !!(
        watchedValues.displayName &&
        watchedValues.dni &&
        watchedValues.phone &&
        watchedValues.province &&
        watchedValues.professionalEntries?.every(p => p.specialty && p.license) &&
        watchedValues.billingInfo?.value &&
        watchedValues.price && watchedValues.price > 0
    );
  }, [watchedValues]);

  const hasCriticalChanges = useMemo(() => {
    return getChangedFields(originalData, watchedValues).length > 0;
  }, [originalData, watchedValues]);

  const buttonState = useMemo(() => {
    const isProfileLocked = profileStatus === 'pending' || profileStatus === 'pending_update';
    if (isProfileLocked) {
      return { text: "Pendiente de Revisión", disabled: true, icon: AlertTriangle, action: 'none' };
    }
    if (profileStatus === 'approved') {
        if (hasCriticalChanges && isValid) {
            return { text: "Enviar Cambios a Validación", disabled: false, icon: Send, action: 'validate' };
        }
        return { text: "Guardar Cambios", disabled: !isDirty, icon: Save, action: 'save' };
    }
    return { text: "Enviar a Validación", disabled: !isSubmittableForValidation, icon: Send, action: 'validate' };
  }, [profileStatus, isDirty, hasCriticalChanges, isSubmittableForValidation, isValid]);

  const onSubmit = async (values: CombinedProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      await updateProfile(user, {
        displayName: `${values.title} ${values.displayName}`,
        photoURL: values.photoURL || undefined
      });

      const userDocRef = doc(db, "users", user.uid);
      
      const finalData: any = {
        ...values,
        experience: values.experience?.map(item => item.value),
        education: values.education?.map(item => item.value),
        role: 'profesional',
        uid: user.uid,
        email: user.email,
      };

      if (buttonState.action === 'validate') {
          finalData.status = profileStatus === 'approved' ? 'pending_update' : 'pending';
          if (profileStatus === 'approved') {
              finalData.modifiedFields = getChangedFields(originalData, values);
          } else {
              finalData.modifiedFields = [];
          }
           toast({
              title: finalData.status === 'pending_update' ? "Perfil enviado a revisión" : "¡Perfil enviado a validación!",
              description: finalData.status === 'pending_update' 
                ? "Tus cambios en datos críticos han sido enviados para validación."
                : "Tus datos han sido enviados para que un administrador los revise.",
           });
      } else { // 'save' action
          toast({
              title: profileStatus === 'incomplete' ? "Borrador guardado" : "Perfil actualizado",
              description: "Tus datos han sido guardados correctamente.",
          });
      }

      await setDoc(userDocRef, finalData, { merge: true });
      await fetchData(user);
      
    } catch (error) {
      console.error("Error updating doctor profile: ", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar tus datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    switch(profileStatus) {
        case 'pending':
        case 'pending_update':
             return (
                 <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Tu perfil está pendiente de aprobación</AlertTitle>
                    <AlertDescription>
                        Actualmente, tu perfil está siendo revisado por un administrador. No podrás editar tus datos hasta que se complete la revisión.
                    </AlertDescription>
                </Alert>
            );
        case 'approved':
             return (
                 <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>¡Tu Perfil está Aprobado y Visible!</AlertTitle>
                    <AlertDescription>
                        Recuerda que si modificas datos críticos (nombre, DNI, matrículas, etc.), tu perfil volverá a revisión.
                    </AlertDescription>
                </Alert>
            );
        case 'incomplete':
        default:
             return (
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Completa tu perfil para que sea aprobado</AlertTitle>
                    <AlertDescription>
                      Para que los pacientes puedan encontrarte, debes completar todos los campos obligatorios y luego enviar tu perfil a validación. Los campos requeridos son:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Información Profesional: Nombre, DNI, Provincia y Teléfono de Contacto.</li>
                        <li>Al menos una Matrícula profesional.</li>
                        <li>Precio de la Consulta.</li>
                        <li>Datos de Facturación: CBU o Alias.</li>
                      </ul>
                    </AlertDescription>
                </Alert>
            );
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline mb-2">Mi Perfil Profesional</h2>
            <p className="text-muted-foreground mb-6">Cargando datos...</p>
            <Skeleton className="h-10 w-full max-w-2xl" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
  }

  const isProfileLocked = profileStatus === 'pending' || profileStatus === 'pending_update';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="mb-6">
            <h2 className="text-2xl font-bold font-headline mb-2">Mi Perfil Profesional</h2>
            <p className="text-muted-foreground">
                Mantén tu información pública actualizada, gestiona tu horario y tus datos de facturación.
            </p>
        </div>
        
        {getStatusMessage()}

        <Tabs defaultValue="profile" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-2xl">
                <TabsTrigger value="profile">
                    <User className="mr-2 h-4 w-4" />
                    Información Profesional
                </TabsTrigger>
                <TabsTrigger value="availability">
                    <Clock className="mr-2 h-4 w-4" />
                    Disponibilidad Semanal
                </TabsTrigger>
                <TabsTrigger value="billing">
                    <Landmark className="mr-2 h-4 w-4" />
                    Datos de Facturación
                </TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <DoctorProfileForm isSubmitting={isSubmitting || isProfileLocked} />
            </TabsContent>
            <TabsContent value="availability" className="mt-6">
                <AvailabilityManager isSubmitting={isSubmitting || isProfileLocked} />
            </TabsContent>
            <TabsContent value="billing" className="mt-6">
                <BillingInfoForm isSubmitting={isSubmitting || isProfileLocked} />
            </TabsContent>
        </Tabs>
        <div className="mt-8 pt-6 border-t flex justify-end">
            <Button 
                type="submit" 
                disabled={isSubmitting || buttonState.disabled}
                title={buttonState.disabled && buttonState.action === 'validate' ? "Completa todos los campos obligatorios para poder enviar a validación" : ""}
                size="lg"
            >
              {buttonState.icon && <buttonState.icon className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Procesando..." : buttonState.text}
            </Button>
        </div>
      </form>
    </Form>
  );
}

    
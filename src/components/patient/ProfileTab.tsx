
"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  displayName: z.string().min(1, "El nombre completo es requerido."),
  dni: z.string().regex(/^[0-9]{7,8}$/, "El DNI debe tener entre 7 y 8 números."),
  phone: z.string().min(1, "El teléfono es requerido."),
  email: z.string().email(),
  sex: z.string().min(1, "El sexo es requerido."),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida."),
  insuranceCompany: z.string().optional(),
  insuranceMemberId: z.string().optional(),
  insurancePlan: z.string().optional(),
}).refine(data => !data.dateOfBirth || !isNaN(Date.parse(data.dateOfBirth)), {
    message: "Fecha inválida.",
    path: ["dateOfBirth"],
});

type ProfileTabProps = {
  setActiveTab: (tab: string) => void;
};

const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export function ProfileTab({ setActiveTab }: ProfileTabProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInsurances, setAvailableInsurances] = useState<{ id: string, name: string }[]>([]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      dni: "",
      phone: "",
      email: "",
      sex: "",
      dateOfBirth: "",
      insuranceCompany: "",
      insuranceMemberId: "",
      insurancePlan: "",
    },
  });
  
  const { formState: { isDirty } } = form;
  const dateOfBirthValue = useWatch({
    control: form.control,
    name: 'dateOfBirth'
  });
  const age = calculateAge(dateOfBirthValue);

  useEffect(() => {
    const fetchInsurances = async () => {
        try {
            const insSnapshot = await getDocs(collection(db, 'insurances'));
            const insList = insSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string })).sort((a, b) => a.name.localeCompare(b.name));
            setAvailableInsurances(insList);
        } catch (error) {
            console.error("Error fetching insurances:", error);
        }
    };
    fetchInsurances();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData = {
          displayName: currentUser.displayName || "",
          dni: "",
          phone: "",
          email: currentUser.email || "",
          sex: "",
          dateOfBirth: "",
          insuranceCompany: "",
          insuranceMemberId: "",
          insurancePlan: "",
        };

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData.displayName = firestoreData.displayName || userData.displayName;
          userData.dni = firestoreData.dni || "";
          userData.phone = firestoreData.phone || "";
          userData.sex = firestoreData.sex || "";
          userData.dateOfBirth = firestoreData.dateOfBirth || "";
          userData.insuranceCompany = firestoreData.insuranceCompany || "";
          userData.insuranceMemberId = firestoreData.insuranceMemberId || "";
          userData.insurancePlan = firestoreData.insurancePlan || "";
        }
        form.reset(userData);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateProfile(user, { displayName: values.displayName });

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName: values.displayName,
        dni: values.dni,
        phone: values.phone,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth,
        insuranceCompany: values.insuranceCompany,
        insuranceMemberId: values.insuranceMemberId,
        insurancePlan: values.insurancePlan,
      }, { merge: true });
      
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente.",
      });
      form.reset(values);
      setActiveTab("appointments");

    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar tus datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Revisa y actualiza tus datos de contacto y cobertura médica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Separator />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>
          Completa y actualiza tus datos de contacto y cobertura médica.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-lg font-medium">Datos de Contacto y Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} placeholder="Escribe tu DNI sin puntos" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} placeholder="+54 9 11 1234-5678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sexo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Femenino">Femenino</SelectItem>
                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                        <Input value={age !== null ? `${age} años` : ''} disabled readOnly />
                    </FormControl>
                </FormItem>
            </div>
            
            <Separator />

            <h3 className="text-lg font-medium">Datos de Cobertura Médica</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra Social / Prepaga</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || availableInsurances.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una cobertura..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ninguna">Ninguna / Particular</SelectItem>
                          {availableInsurances.map(ins => (
                            <SelectItem key={ins.id} value={ins.name}>{ins.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="insuranceMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Afiliado</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} placeholder="Ej: 12345678/00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="insurancePlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} placeholder="Ej: 210, Azul, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>

            <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

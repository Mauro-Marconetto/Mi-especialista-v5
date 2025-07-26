
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

const familyMemberSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  dni: z.string().regex(/^[0-9]{7,8}$/, "El DNI debe tener entre 7 y 8 números."),
  relationship: z.string().min(1, "El parentesco es requerido."),
  sex: z.string().optional(),
  dateOfBirth: z.string().optional(),
  insuranceCompany: z.string().optional(),
  insuranceMemberId: z.string().optional(),
  insurancePlan: z.string().optional(),
}).refine(data => !data.dateOfBirth || !isNaN(Date.parse(data.dateOfBirth)), {
    message: "Fecha inválida.",
    path: ["dateOfBirth"],
});

const familyFormSchema = z.object({
  familyMembers: z.array(familyMemberSchema),
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;
type FamilyFormValues = z.infer<typeof familyFormSchema>;

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

export function FamilyTab() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInsurances, setAvailableInsurances] = useState<{ id: string, name: string }[]>([]);
  const { toast } = useToast();

  const form = useForm<FamilyFormValues>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      familyMembers: [],
    },
  });

  const { formState: { isDirty } } = form;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "familyMembers",
  });

  const watchedFamilyMembers = useWatch({
    control: form.control,
    name: 'familyMembers',
  });
  
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
        setIsLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const sanitizedFamilyMembers = (data.familyMembers || []).map((member: FamilyMember) => ({
            name: member.name || "",
            dni: member.dni || "",
            relationship: member.relationship || "",
            sex: member.sex || "",
            dateOfBirth: member.dateOfBirth || "",
            insuranceCompany: member.insuranceCompany || "",
            insuranceMemberId: member.insuranceMemberId || "",
            insurancePlan: member.insurancePlan || ""
          }));
          form.reset({ familyMembers: sanitizedFamilyMembers });
        }
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [form]);

  const onSubmit = async (values: FamilyFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        familyMembers: values.familyMembers,
      });
      toast({
        title: "Familiares actualizados",
        description: "La lista de tus familiares ha sido guardada.",
      });
      form.reset(values);
    } catch (error) {
      console.error("Error updating family members:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la lista de familiares.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddNewMember = () => {
    append({ 
      name: "", 
      dni: "", 
      relationship: "",
      dateOfBirth: "",
      sex: "",
      insuranceCompany: "",
      insuranceMemberId: "",
      insurancePlan: ""
    });
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mi Grupo Familiar</CardTitle>
                <CardDescription>
                    Agrega a tus familiares para poder gestionar sus turnos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-32 mt-4" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Grupo Familiar</CardTitle>
        <CardDescription>
          Agrega o edita la información de tus familiares para poder agendar turnos en su nombre de forma rápida y sencilla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.length === 0 && (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                  <p>Aún no has agregado a ningún familiar.</p>
                  <p className="text-sm">Usa el botón de abajo para empezar.</p>
                </div>
              )}
              {fields.map((field, index) => {
                  const age = calculateAge(watchedFamilyMembers?.[index]?.dateOfBirth);
                  return (
                    <div key={field.id} className="p-4 border rounded-lg bg-muted/50 relative">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow w-full">
                        <FormField
                          control={form.control}
                          name={`familyMembers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Maria Gomez" {...field} disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`familyMembers.${index}.dni`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DNI</FormLabel>
                              <FormControl>
                                <Input placeholder="Sin puntos" {...field} disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`familyMembers.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parentesco</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Hijo/a">Hijo/a</SelectItem>
                                        <SelectItem value="Cónyuge">Cónyuge</SelectItem>
                                        <SelectItem value="Padre/Madre">Padre/Madre</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                            control={form.control}
                            name={`familyMembers.${index}.dateOfBirth`}
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
                            name={`familyMembers.${index}.sex`}
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
                      <Separator className="my-4" />
                      <p className="text-sm font-medium mb-2">Datos de Cobertura (Opcional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow w-full">
                        <FormField
                          control={form.control}
                          name={`familyMembers.${index}.insuranceCompany`}
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
                          name={`familyMembers.${index}.insuranceMemberId`}
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
                          name={`familyMembers.${index}.insurancePlan`}
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
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar familiar?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar a este familiar de tu lista?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(index)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewMember}
                  disabled={isSubmitting}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Familiar
                </Button>
                <Button type="submit" disabled={!isDirty || isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

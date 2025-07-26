

"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { specialties, provinces } from "@/lib/placeholder-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusCircle, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const languageLevelEnum = z.enum(["Básico", "Intermedio", "Avanzado", "Bilingüe", "Nativo"]);
import * as z from 'zod';

export function DoctorProfileForm({ isSubmitting }: { isSubmitting: boolean }) {
  const { control, watch } = useFormContext();
  const photoURLValue = watch("photoURL");
  const [availableInsurances, setAvailableInsurances] = useState<{ id: string; name: string }[]>([]);

  const { fields: professionalFields, append: appendProfessional, remove: removeProfessional } = useFieldArray({ control, name: "professionalEntries" });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: "experience" });
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control, name: "education" });
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({ control, name: "languages" });

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
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Profesional</CardTitle>
        <CardDescription>
          Completa los datos que verán los pacientes en tu perfil público.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full sm:w-1/4">
                <FormLabel>Título</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Título..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Dra.">Dra.</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="displayName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Nombre y Apellido</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} placeholder="Juan Pérez" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <FormField
            control={control}
            name="dni"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>DNI</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} placeholder="Escribe tu DNI sin puntos" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Teléfono de Contacto</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} placeholder="+54 9 11 1234-5678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="province"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Provincia de Residencia</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu provincia..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6 items-start">
          <FormField
            control={control}
            name="photoURL"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>URL de la Foto de Perfil</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} placeholder="https://ejemplo.com/foto.png" />
                </FormControl>
                <FormDescription>
                  Pega la URL de una imagen pública. Usa un servicio como Imgur o similar.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col items-center gap-2">
            <FormLabel>Vista Previa</FormLabel>
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={photoURLValue || undefined} alt="Vista previa de la foto de perfil" />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
            <FormField
                control={control}
                name="price"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Precio de la Consulta Particular (ARS)</FormLabel>
                    <FormControl>
                        <Input 
                        type="text" 
                        inputMode="numeric"
                        {...field}
                        onChange={event => {
                            const { value } = event.target;
                            if (/^\d*$/.test(value)) {
                                field.onChange(value);
                            }
                        }}
                        disabled={isSubmitting}
                        placeholder="5000"
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div>
          <FormLabel>Especialidades y Matrículas</FormLabel>
           <FormDescription className="pb-2">
              Añade tus credenciales profesionales. Serán validadas por nuestro equipo.
            </FormDescription>
          <div className="space-y-4">
            {professionalFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                <FormField
                  control={control}
                  name={`professionalEntries.${index}.specialty`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Especialidad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialties.map(spec => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`professionalEntries.${index}.license`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Nº de Matrícula</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="MN 12345" disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProfessional(index)} disabled={isSubmitting || professionalFields.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => appendProfessional({ specialty: "", license: "" })}
            disabled={isSubmitting}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir otra especialidad
          </Button>
        </div>
        
        <FormField
          control={control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biografía / Sobre mí</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Una breve descripción sobre tu carrera, enfoque y lo que los pacientes pueden esperar de tu consulta..."
                  className="resize-y min-h-[100px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
               <FormDescription>
                Este texto aparecerá en tu perfil público.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DynamicFieldArray
          label="Experiencia Profesional"
          description="Añade tus roles o logros profesionales más relevantes."
          fields={experienceFields}
          name="experience"
          append={appendExperience}
          remove={removeExperience}
          placeholder="Ej: Jefe de Cardiología, Hospital Alemán"
          buttonText="Añadir Experiencia"
          control={control}
          disabled={isSubmitting}
        />

        <DynamicFieldArray
          label="Formación Académica"
          description="Añade tus títulos, postgrados o certificaciones."
          fields={educationFields}
          name="education"
          append={appendEducation}
          remove={removeEducation}
          placeholder="Ej: Especialista en Cardiología, UBA"
          buttonText="Añadir Formación"
          control={control}
          disabled={isSubmitting}
        />

        <div>
          <FormLabel>Idiomas</FormLabel>
          <FormDescription className="pb-2">Añade los idiomas que hablas y tu nivel.</FormDescription>
          <div className="space-y-4">
            {languageFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                <FormField
                  control={control}
                  name={`languages.${index}.language`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Idioma</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Inglés" disabled={isSubmitting}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`languages.${index}.level`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Nivel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {languageLevelEnum.options.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLanguage(index)} disabled={isSubmitting}>
                  <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendLanguage({ language: "", level: "Intermedio" })}
            disabled={isSubmitting}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Idioma
          </Button>
        </div>

        <FormField
          control={control}
          name="insurances"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Obras Sociales y Prepagas</FormLabel>
                <FormDescription>
                  Selecciona las coberturas que aceptas. Estas se mostrarán en tu perfil público.
                </FormDescription>
              </div>
              {availableInsurances.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableInsurances.map((insurance) => (
                    <FormField
                      key={insurance.id}
                      control={control}
                      name="insurances"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={insurance.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(insurance.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([...currentValue, insurance.name])
                                    : field.onChange(
                                        currentValue.filter(
                                          (value) => value !== insurance.name
                                        )
                                      );
                                }}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {insurance.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay obras sociales para seleccionar. El administrador debe cargarlas en la base de datos.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

const DynamicFieldArray = ({
    label,
    description,
    fields,
    name,
    append,
    remove,
    placeholder,
    buttonText,
    control,
    disabled
  }: {
    label: string,
    description: string,
    fields: any[],
    name: "experience" | "education",
    append: (val: { value: string }) => void,
    remove: (index: number) => void,
    placeholder: string,
    buttonText: string,
    control: any,
    disabled: boolean
  }) => (
    <div>
      <FormLabel>{label}</FormLabel>
      <FormDescription className="pb-2">{description}</FormDescription>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`${name}.${index}.value`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder={placeholder} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={disabled}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ value: "" })}
        disabled={disabled}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  );

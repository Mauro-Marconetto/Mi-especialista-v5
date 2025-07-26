
"use client";

import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const dayNames = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DayAvailability = ({ day, isSubmitting }: { day: keyof typeof dayNames, isSubmitting: boolean }) => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
      control,
      name: `weeklyAvailability.${day}.slots`
    });
    
    const isEnabled = useWatch({
      control,
      name: `weeklyAvailability.${day}.enabled`,
    });
    
    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name={`weeklyAvailability.${day}.enabled`}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{dayNames[day]}</FormLabel>
                            <FormDescription>
                                { isEnabled ? "Día hábil" : "Día no hábil" }
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                        </FormControl>
                    </FormItem>
                )}
            />
            {isEnabled && (
                <div className="pl-4 border-l-2 ml-6 space-y-4">
                    {fields.map((item, index) => (
                         <div key={item.id} className="flex items-end gap-2">
                             <FormField
                                control={control}
                                name={`weeklyAvailability.${day}.slots.${index}.start`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Desde</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} disabled={isSubmitting}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                             />
                              <FormField
                                control={control}
                                name={`weeklyAvailability.${day}.slots.${index}.end`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Hasta</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} disabled={isSubmitting}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                             />
                             <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                             </Button>
                         </div>
                    ))}
                     <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ start: "09:00", end: "17:00" })}
                        disabled={isSubmitting}
                     >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Rango Horario
                    </Button>
                </div>
            )}
        </div>
    );
};

export function AvailabilityManager({ isSubmitting }: { isSubmitting: boolean }) {
  const { control } = useFormContext();

  return (
    <Card>
        <CardHeader>
            <CardTitle>Disponibilidad Semanal</CardTitle>
            <CardDescription>
                Define tus horarios de atención recurrentes. Estos se usarán para mostrar tu disponibilidad a los pacientes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-8">
                <FormField
                    control={control}
                    name="appointmentDuration"
                    render={({ field }) => (
                        <FormItem className="max-w-sm">
                        <FormLabel>Duración del Turno (minutos)</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            {...field} 
                            disabled={isSubmitting} 
                            placeholder="30"
                            />
                        </FormControl>
                        <FormDescription>
                            Define cuántos minutos dura cada consulta (ej. 20, 30, 45).
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator/>

                 {(Object.keys(dayNames) as Array<keyof typeof dayNames>).map((day, index) => (
                    <div key={day}>
                        <DayAvailability day={day} isSubmitting={isSubmitting} />
                        {index < Object.keys(dayNames).length - 1 && <Separator className="mt-8"/>}
                    </div>
                 ))}
             </div>
        </CardContent>
    </Card>
  );
}

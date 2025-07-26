"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TimeSlot = {
    start: string;
    end: string;
}

export function AvailabilityCalendar() {
    const [days, setDays] = useState<Date[] | undefined>();
    const [schedule, setSchedule] = useState<Record<string, TimeSlot[]>>({});
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");

    const addSchedule = () => {
        if (!days || days.length === 0) return;

        const newSchedule = { ...schedule };
        days.forEach(day => {
            const dayString = day.toISOString().split('T')[0];
            if (!newSchedule[dayString]) {
                newSchedule[dayString] = [];
            }
            // Avoid adding duplicate time slots
            if (!newSchedule[dayString].some(slot => slot.start === startTime && slot.end === endTime)) {
                 newSchedule[dayString].push({ start: startTime, end: endTime });
                 newSchedule[dayString].sort((a,b) => a.start.localeCompare(b.start));
            }
        });
        setSchedule(newSchedule);
    };

    const removeSlot = (day: string, slotToRemove: TimeSlot) => {
        const newSchedule = { ...schedule };
        newSchedule[day] = newSchedule[day].filter(slot => slot.start !== slotToRemove.start || slot.end !== slotToRemove.end);
        if(newSchedule[day].length === 0) {
            delete newSchedule[day];
        }
        setSchedule(newSchedule);
    }
    
    const sortedDays = Object.keys(schedule).sort();

    return (
        <Card className="shadow-lg">
            <div className="grid md:grid-cols-2">
                <div className="p-6 border-b md:border-r md:border-b-0">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="font-headline">1. Selecciona Días</CardTitle>
                        <CardDescription>Elige uno o varios días para configurar.</CardDescription>
                    </CardHeader>
                    <Calendar
                        mode="multiple"
                        selected={days}
                        onSelect={setDays}
                        className="rounded-md border"
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                    />
                </div>
                <div className="p-6">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="font-headline">2. Define Horarios</CardTitle>
                        <CardDescription>Añade los rangos horarios para los días seleccionados.</CardDescription>
                    </CardHeader>
                    <div className="flex items-end gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="start-time">Desde</Label>
                            <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="end-time">Hasta</Label>
                            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                        <Button onClick={addSchedule} size="icon" aria-label="Añadir horario">
                            <PlusCircle />
                        </Button>
                    </div>
                    <div className="mt-6">
                         <h3 className="font-semibold flex items-center gap-2 mb-4">
                             <Clock className="text-primary"/> Tu Horario Semanal
                         </h3>
                         {sortedDays.length > 0 ? (
                             <div className="space-y-3">
                                 {sortedDays.map(day => (
                                     <div key={day}>
                                         <p className="font-medium">{new Date(day + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                         <div className="flex flex-wrap gap-2 mt-1">
                                             {schedule[day].map(slot => (
                                                 <Badge key={`${slot.start}-${slot.end}`} variant="outline" className="text-base py-1">
                                                     {slot.start} - {slot.end}
                                                     <button onClick={() => removeSlot(day, slot)} className="ml-2 text-muted-foreground hover:text-destructive">×</button>
                                                 </Badge>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-sm text-muted-foreground">Aún no has definido tu horario.</p>
                         )}
                     </div>
                </div>
            </div>
        </Card>
    );
}

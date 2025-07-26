

"use client";

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export type PatientDataForNote = {
    appointmentId: string;
    patientId: string;
    patientName: string;
    familyMemberDni?: string;
    dni?: string;
    sex?: string;
    dateOfBirth?: string;
    insuranceCompany?: string;
    insuranceMemberId?: string;
    insurancePlan?: string;
};

export type ClinicalNote = {
  id: string;
  date: string;
  doctorName: string;
  content: string;
  createdAt?: Date;
};

type ClinicalNoteDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patientData: PatientDataForNote;
    clinicalHistory: ClinicalNote[];
    onSave: (note: string) => Promise<boolean>;
};

const calculateAge = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age.toString();
};

export function ClinicalNoteDialog({ isOpen, onOpenChange, patientData, clinicalHistory, onSave }: ClinicalNoteDialogProps) {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!note.trim()) {
            toast({
                title: "Nota vacía",
                description: "Debes añadir una nota clínica para completar el turno.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const success = await onSave(note);
        if (success) {
            setNote('');
            onOpenChange(false);
        }
        setIsSubmitting(false);
    };
    
    const age = calculateAge(patientData.dateOfBirth);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registro de consulta</DialogTitle>
                    <DialogDesc>
                        Añade una nota para el historial clínico. Esta acción marcará el turno como completado.
                    </DialogDesc>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Left Panel: History */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Historial Clínico del Paciente</h3>
                        <ScrollArea className="flex-grow pr-4">
                             {clinicalHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {clinicalHistory.map((note) => (
                                        <Card key={note.id} className="shadow-sm">
                                            <CardHeader className="p-3 pb-2">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-sm font-semibold">
                                                        {new Date(note.date + 'T00:00:00').toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}
                                                    </CardTitle>
                                                    <Badge variant="secondary" className="text-xs">{note.doctorName}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                <p className="text-xs text-foreground/80 whitespace-pre-line">
                                                    {note.content}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                                    No hay notas previas para este paciente.
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Right Panel: New Note */}
                    <div className="flex flex-col gap-4">
                         <Card className="bg-muted/50 shrink-0">
                            <CardHeader className="p-3">
                                <CardTitle className="text-base">{patientData.patientName}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-xs">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div><span className="font-semibold">DNI:</span> {patientData.dni || 'N/A'}</div>
                                    <div><span className="font-semibold">Edad:</span> {age} años</div>
                                    <div><span className="font-semibold">Sexo:</span> {patientData.sex || 'N/A'}</div>
                                    <div><span className="font-semibold">Nacimiento:</span> {patientData.dateOfBirth ? new Date(patientData.dateOfBirth + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'N/A'}</div>
                                </div>
                                {(patientData.insuranceCompany && patientData.insuranceCompany !== 'ninguna') && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div className="col-span-2"><span className="font-semibold">Cobertura:</span> {patientData.insuranceCompany}</div>
                                            <div><span className="font-semibold">Plan:</span> {patientData.insurancePlan || 'N/A'}</div>
                                            <div><span className="font-semibold">Afiliado:</span> {patientData.insuranceMemberId || 'N/A'}</div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex flex-col flex-grow">
                            <Label htmlFor="note" className="font-semibold mb-2">Nueva Nota de Evolución</Label>
                            <Textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="h-full resize-none"
                                placeholder="Escribe la evolución, diagnóstico o tratamiento aquí..."
                                disabled={isSubmitting}
                            />
                        </div>
                         <div className="flex justify-end gap-2 shrink-0 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Nota y Completar"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Label } from "@/components/ui/label";

type NewClinicalNoteFormProps = {
    patientId: string;
    familyMemberDni?: string | null;
    onNoteAdded: () => void;
    onSubmittingChange: (isSubmitting: boolean) => void;
};

export function NewClinicalNoteForm({ patientId, familyMemberDni, onNoteAdded, onSubmittingChange }: NewClinicalNoteFormProps) {
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [user] = useAuthState(auth);

    useEffect(() => {
        onSubmittingChange(isSubmitting);
    }, [isSubmitting, onSubmittingChange]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) {
            toast({
                title: "Consulta vacía",
                description: "Por favor, escribe algo en la nota clínica.",
                variant: "destructive"
            });
            return;
        }
        if (!user) {
             toast({
                title: "Error de autenticación",
                description: "Debes estar logueado para añadir una nota.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            await addDoc(collection(db, 'clinicalNotes'), {
                patientId: patientId,
                familyMemberDni: familyMemberDni || null,
                doctorId: user.uid,
                doctorName: user.displayName,
                appointmentId: null, // This note is not from a specific appointment
                date: new Date().toISOString().split('T')[0],
                note: note,
                createdAt: serverTimestamp(),
            });
            
            toast({
                title: "Consulta guardada",
                description: "La nueva entrada en la historia clínica ha sido guardada.",
            });
            setNote("");
            onNoteAdded(); // Callback to re-fetch the notes list and close dialog
        } catch (error) {
            console.error("Error saving new note:", error);
            toast({
                title: "Error al guardar",
                description: "No se pudo añadir la consulta. Intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="new-note-content">Contenido de la Consulta</Label>
                 <Textarea
                    id="new-note-content"
                    placeholder="Escribe la evolución, diagnóstico o tratamiento aquí..."
                    className="min-h-[250px] resize-y"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting}
                />
            </div>
            <div className="flex justify-end">
                 <Button type="submit" disabled={isSubmitting || !note.trim()}>
                    {isSubmitting ? "Guardando..." : "Guardar Consulta"}
                </Button>
            </div>
        </form>
    );
}

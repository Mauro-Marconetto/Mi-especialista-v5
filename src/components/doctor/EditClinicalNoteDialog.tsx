
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ClinicalNote } from '@/lib/placeholder-data';

type EditClinicalNoteDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    note: ClinicalNote;
    onSave: (noteId: string, newContent: string) => Promise<boolean>;
};

export function EditClinicalNoteDialog({ isOpen, onOpenChange, note, onSave }: EditClinicalNoteDialogProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (note) {
            setContent(note.content);
        }
    }, [note]);

    const handleSave = async () => {
        if (!content.trim()) {
            toast({
                title: "Consulta vacía",
                description: "La nota clínica no puede estar vacía.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const success = await onSave(note.id, content);
        if (success) {
            onOpenChange(false);
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) onOpenChange(open); }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Consulta</DialogTitle>
                    <DialogDescription>
                        Modifica la entrada del {new Date(note.date + 'T00:00:00').toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}. Haz clic en guardar cuando termines.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="note-content">Contenido de la consulta</Label>
                        <Textarea
                            id="note-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[250px] resize-y"
                            placeholder="Escribe la evolución, diagnóstico o tratamiento aquí..."
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isSubmitting || content === note.content}>
                        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

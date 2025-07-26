
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { NewClinicalNoteForm } from '@/components/doctor/NewClinicalNoteForm';

type NewClinicalNoteDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patientId: string;
    familyMemberDni?: string | null;
    onNoteAdded: () => void;
};

export function NewClinicalNoteDialog({ isOpen, onOpenChange, patientId, familyMemberDni, onNoteAdded }: NewClinicalNoteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // We lift the form submission logic to the parent dialog to control the dialog state
    const handleFormSubmit = async (note: string) => {
        // Here you would call the actual submission logic, which is now inside NewClinicalNoteForm
        // For now, the form handles its own submission. This function is a placeholder for potential future logic.
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Añadir Nueva Consulta</DialogTitle>
                    <DialogDescription>
                        Registra una nueva entrada en la historia clínica del paciente.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                   <NewClinicalNoteForm
                     patientId={patientId}
                     familyMemberDni={familyMemberDni}
                     onNoteAdded={onNoteAdded}
                     onSubmittingChange={setIsSubmitting}
                   />
                </div>
            </DialogContent>
        </Dialog>
    );
}

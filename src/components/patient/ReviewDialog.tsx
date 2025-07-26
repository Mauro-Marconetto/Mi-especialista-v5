
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientAppointment } from "@/lib/placeholder-data";

type ReviewDialogProps = {
  appointment: PatientAppointment | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (appointmentId: string, doctorId: string, rating: number, comment: string) => Promise<void>;
};

export function ReviewDialog({ appointment, isOpen, onOpenChange, onSubmit }: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!appointment || rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit(appointment.id, appointment.doctorId, rating, comment);
    setIsSubmitting(false);
    onOpenChange(false);
    // Reset state for next use
    setRating(0);
    setComment("");
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Deja tu opinión</DialogTitle>
          <DialogDescription>
            Califica tu experiencia con {appointment.doctorName} para la consulta del {new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label className="mb-2 block">Calificación</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comment" className="mb-2 block">Comentario (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte más detalles sobre tu experiencia..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Opinión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useState } from "react";
import type { PatientAppointment } from "@/lib/placeholder-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, FilePenLine } from 'lucide-react';
import { ReviewDialog } from "./ReviewDialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ReviewsTabProps {
  appointments: PatientAppointment[];
  isLoading: boolean;
  onSubmitReview: (appointmentId: string, doctorId: string, rating: number, comment: string) => Promise<void>;
}

export function ReviewsTab({ appointments, isLoading, onSubmitReview }: ReviewsTabProps) {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);

  const handleOpenReviewDialog = (appointment: PatientAppointment) => {
    setSelectedAppointment(appointment);
    setIsReviewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-48" />
                             <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <ReviewDialog
        appointment={selectedAppointment}
        isOpen={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onSubmit={onSubmitReview}
      />
      <div className="space-y-6">
         <Card>
            <CardHeader>
                <CardTitle>Opiniones Pendientes</CardTitle>
                <CardDescription>
                    Califica tus consultas para ayudar a otros pacientes a elegir y a los profesionales a mejorar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map(appt => (
                             <Card key={appt.id} className="shadow-sm">
                                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                     <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={appt.doctorPhotoUrl} alt={appt.doctorName} />
                                            <AvatarFallback>{appt.doctorName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{appt.doctorName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Consulta del {new Date(appt.date + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} para {appt.patientName}
                                            </p>
                                        </div>
                                    </div>
                                     <Button onClick={() => handleOpenReviewDialog(appt)}>
                                        <FilePenLine className="mr-2 h-4 w-4" />
                                        Dejar una Opinión
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 border-2 border-dashed rounded-lg bg-muted/50">
                        <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 font-semibold">¡Estás al día!</p>
                        <p className="mt-1 text-sm text-muted-foreground">No tienes consultas pendientes de calificación.</p>
                    </div>
                )}
            </CardContent>
         </Card>
      </div>
    </>
  );
}

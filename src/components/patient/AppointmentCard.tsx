
"use client";

import Link from "next/link";
import { type User } from "firebase/auth";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Stethoscope, Video, AlertCircle, Hourglass, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientAppointment } from "@/lib/placeholder-data";
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

export const AppointmentCard = ({ 
  appointment,
  onCancel,
  onReschedule,
  onJoinWaitingRoom,
  onJoinMeeting,
  isActionLoading,
  user,
  showWaitingRoomButton = false,
}: { 
  appointment: PatientAppointment;
  onCancel: (appointmentId: string) => Promise<void>;
  onReschedule: (appointmentId: string, doctorId: string) => void;
  onJoinWaitingRoom: (appointmentId: string) => void;
  onJoinMeeting: (appointmentId: string, meetingUrl: string) => void;
  isActionLoading: boolean;
  user: User | null;
  showWaitingRoomButton?: boolean;
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(appointment.date + 'T00:00:00');
  const isUpcoming = appointmentDate >= today && appointment.status === 'Confirmado';
  
  const statusConfig = {
    'Confirmado': { variant: "default", icon: Calendar, text: "text-primary-foreground" },
    'Completado': { variant: "secondary", icon: Stethoscope, text: "text-secondary-foreground" },
    'Cancelado': { variant: "destructive", icon: AlertCircle, text: "text-destructive-foreground" },
  } as const;

  const currentStatus = statusConfig[appointment.status] || statusConfig['Confirmado'];
  
  return (
    <Card className="shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="p-4 bg-muted/50">
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="text-lg font-headline">{appointment.doctorName}</CardTitle>
                 <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Stethoscope className="w-4 h-4 text-primary"/> {appointment.doctorSpecialty}
                 </CardDescription>
            </div>
            <Badge variant={currentStatus.variant} className={cn("text-xs", currentStatus.text)}>
                <currentStatus.icon className="w-3 h-3 mr-1.5" />
                {appointment.status}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(appointment.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{appointment.time} hs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span>Videoconsulta</span>
            </div>
             <div className="flex items-center gap-2 text-sm font-medium">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span>Para: {appointment.patientName}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end items-center flex-wrap gap-2 pt-4 border-t p-4 bg-muted/20">
          {isUpcoming && (
              <>
                  {appointment.meetingUrl ? (
                        <Button 
                          size="sm"
                          onClick={() => onJoinMeeting(appointment.id, appointment.meetingUrl!)}
                          disabled={isActionLoading}
                        >
                            <Video className="mr-2 h-4 w-4" />
                            {isActionLoading ? 'Conectando...' : 'Unirse a la Consulta'}
                        </Button>
                  ) : (
                      showWaitingRoomButton && (
                          <Button size="sm" onClick={() => onJoinWaitingRoom(appointment.id)} disabled={isActionLoading}>
                              <Hourglass className="mr-2 h-4 w-4" />
                              {isActionLoading ? 'Ingresando...' : 'Ingresar a sala de espera'}
                          </Button>
                      )
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onReschedule(appointment.id, appointment.doctorId)}
                    disabled={isActionLoading}
                  >
                    Reprogramar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isActionLoading}>
                        Cancelar Turno
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de que quieres cancelar?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se notificará al profesional sobre la cancelación de tu turno.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onCancel(appointment.id)}>
                          Sí, cancelar turno
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </>
          )}
            {!isUpcoming && appointment.status === 'Completado' && (
              <Button variant="outline" size="sm">Dejar una Opinión</Button>
          )}
            <Button asChild size="sm" variant="secondary">
              <Link href={`/doctors/${appointment.doctorId}`}>Ver Profesional</Link>
          </Button>
      </CardFooter>
    </Card>
  )
}

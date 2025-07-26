
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { PatientAppointment } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Clock, CalendarCheck, Stethoscope, Hourglass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { AppointmentCard } from "./AppointmentCard";
import { Badge } from "@/components/ui/badge";

export function AppointmentsTab() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | false>(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            setUser(null);
            setAppointments([]);
            setIsLoading(false);
        }
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", user.uid),
      where("status", "==", "Confirmado")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fetchedAppointments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                doctorName: data.doctorName,
                doctorSpecialty: data.doctorSpecialty,
                date: data.date,
                time: data.time,
                status: data.status,
                location: data.location,
                type: data.type,
                doctorId: data.doctorId,
                meetingUrl: data.meetingUrl,
                patientReady: data.patientReady || false,
                patientJoined: data.patientJoined || false,
                patientName: data.patientName || "No especificado",
                doctorPhotoUrl: data.doctorPhotoUrl,
            } as PatientAppointment;
        }).filter(appt => {
            const apptDate = new Date(appt.date + 'T00:00:00');
            return apptDate >= today;
        });
        
        const sortedAppointments = fetchedAppointments.sort((a, b) => {
          const aDateTime = new Date(`${a.date}T${a.time}`);
          const bDateTime = new Date(`${b.date}T${b.time}`);
          return aDateTime.getTime() - bDateTime.getTime();
        });

        setAppointments(sortedAppointments);
        setIsLoading(false);

    }, (error) => {
        console.error("Error fetching patient appointments:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus turnos.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const handleCancel = async (appointmentId: string) => {
    setIsActionLoading(appointmentId);
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { status: 'Cancelado' });
      // The onSnapshot listener will automatically update the UI
      toast({
        title: "Turno cancelado",
        description: "Tu turno ha sido cancelado exitosamente.",
      });
    } catch (error) {
      console.error(`Error cancelling appointment ${appointmentId}:`, error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el turno.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleJoinWaitingRoom = async (appointmentId: string) => {
    setIsActionLoading(appointmentId);
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, { patientReady: true });
        router.push(`/dashboard/patient/waiting-room/${appointmentId}`);
    } catch (error) {
        console.error("Error joining waiting room:", error);
        toast({
            title: "Error",
            description: "No se pudo ingresar a la sala de espera.",
            variant: "destructive",
        });
    } finally {
        setTimeout(() => setIsActionLoading(false), 1000);
    }
  };
  
  const handleJoinMeeting = async (appointmentId: string, meetingUrl: string) => {
    setIsActionLoading(appointmentId);
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      await updateDoc(appointmentRef, { patientJoined: true });
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error setting patientJoined status:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar tu ingreso. Intenta unirte de nuevo.",
        variant: "destructive",
      });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleReschedule = (appointmentId: string, doctorId: string) => {
    router.push(`/doctors/${doctorId}?reschedule=${appointmentId}`);
  };
  
  const { nextAppointment, otherAppointments } = useMemo(() => {
    return {
      nextAppointment: appointments.length > 0 ? appointments[0] : null,
      otherAppointments: appointments.length > 1 ? appointments.slice(1) : [],
    };
  }, [appointments]);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Separator />
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Card><CardContent className="p-4 space-y-4"><Skeleton className="h-20 w-full rounded-lg" /></CardContent></Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      {nextAppointment ? (
        <>
          <Card className="border-2 border-primary shadow-lg bg-primary/5">
            <CardHeader>
                <CardTitle className="font-headline text-primary flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6" />
                    Tu Próximo Turno
                </CardTitle>
                <CardDescription>Para: {nextAppointment.patientName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                         <AvatarImage src={nextAppointment.doctorPhotoUrl} alt={nextAppointment.doctorName} />
                        <AvatarFallback className="text-xl bg-primary/20 text-primary font-semibold">
                          {nextAppointment.doctorName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                           <p className="text-xl font-semibold">{nextAppointment.doctorName}</p>
                           {nextAppointment.meetingUrl && (
                                <Badge variant="success">
                                    <Video className="mr-1.5 h-3 w-3" />
                                    Médico en línea
                                </Badge>
                            )}
                        </div>
                        <p className="flex items-center gap-1.5 text-md text-muted-foreground mt-1">
                          <Stethoscope className="w-4 h-4" />
                          {nextAppointment.doctorSpecialty}
                        </p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              {new Date(nextAppointment.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
                            </span>
                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{nextAppointment.time} hs</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    {nextAppointment.meetingUrl ? (
                        <Button 
                            size="lg" 
                            className="w-full sm:w-auto"
                            onClick={() => handleJoinMeeting(nextAppointment.id, nextAppointment.meetingUrl!)}
                            disabled={isActionLoading === nextAppointment.id}
                        >
                            <Video className="mr-2 h-5 w-5" />
                            {isActionLoading === nextAppointment.id ? 'Conectando...' : 'Unirse a la Consulta'}
                        </Button>
                    ) : (
                        <Button size="lg" className="w-full sm:w-auto" onClick={() => handleJoinWaitingRoom(nextAppointment.id)} disabled={isActionLoading === nextAppointment.id}>
                            <Hourglass className="mr-2 h-5 w-5" />
                            {isActionLoading === nextAppointment.id ? 'Ingresando...' : 
                             'Ingresar a sala de espera'
                            }
                        </Button>
                    )}
                     <div className="flex gap-2 mt-2 sm:mt-0 sm:flex-col w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReschedule(nextAppointment.id, nextAppointment.doctorId)}
                        disabled={!!isActionLoading}
                      >
                        Reprogramar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1" disabled={!!isActionLoading}>
                            Cancelar
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
                            <AlertDialogAction onClick={() => handleCancel(nextAppointment.id)}>
                              Sí, cancelar turno
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                </div>
            </CardContent>
          </Card>

          {otherAppointments.length > 0 && (
            <div>
              <Separator className="my-8" />
              <h3 className="text-xl font-bold font-headline mb-4">Siguientes Turnos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {otherAppointments.map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onCancel={handleCancel}
                    onReschedule={handleReschedule}
                    onJoinWaitingRoom={handleJoinWaitingRoom}
                    onJoinMeeting={handleJoinMeeting}
                    isActionLoading={isActionLoading === appt.id}
                    user={user}
                    showWaitingRoomButton
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center p-10 border-2 border-dashed bg-muted/50">
            <CardHeader className="p-0">
                <CardTitle>No tienes turnos próximos</CardTitle>
                <CardDescription className="mt-2">Cuando agendes una nueva cita, aparecerá aquí.</CardDescription>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}

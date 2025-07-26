

"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, doc, updateDoc, onSnapshot, getDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Video, CalendarDays, CalendarCheck, AlertTriangle, ExternalLink, UserCheck, CheckCircle, History, FileText, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicalNoteDialog, type PatientDataForNote, type ClinicalNote } from '@/components/doctor/ClinicalNoteDialog';
import { createGoogleMeet } from '@/lib/google-meet-actions';


type Appointment = {
    id: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    patientPhotoUrl: string;
    familyMemberDni?: string;
    date: Date;
    time: string;
    dateTime: Date;
    type: 'Telemedicina';
    meetingUrl?: string;
    isDelayed: boolean;
    patientReady: boolean;
    patientJoined?: boolean;
    status: 'Confirmado' | 'Completado';
};

export default function DoctorAppointmentsPage() {
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [patientDataForNote, setPatientDataForNote] = useState<PatientDataForNote | null>(null);
    const [clinicalHistory, setClinicalHistory] = useState<ClinicalNote[]>([]);
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchAppointments = useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", user.uid),
            where("status", "in", ["Confirmado", "Completado"])
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const now = new Date();
            const fetchedAppointments: Appointment[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const apptDateTime = new Date(`${data.date}T${data.time}`);
                return {
                    id: doc.id,
                    patientId: data.patientId,
                    patientName: data.patientName,
                    patientEmail: data.patientEmail,
                    patientPhotoUrl: data.patientPhotoUrl || 'https://placehold.co/100x100.png',
                    familyMemberDni: data.familyMemberDni,
                    date: new Date(data.date + 'T00:00:00'),
                    time: data.time,
                    dateTime: apptDateTime,
                    type: data.type,
                    meetingUrl: data.meetingUrl,
                    isDelayed: apptDateTime < now && data.status === 'Confirmado',
                    patientReady: data.patientReady || false,
                    patientJoined: data.patientJoined || false,
                    status: data.status,
                };
            });
            setAllAppointments(fetchedAppointments);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching appointments:", error);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [user]);

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                setAllAppointments([]);
                setIsLoading(false);
            }
        });
        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            const appointmentsUnsubscribe = fetchAppointments();
            return () => appointmentsUnsubscribe?.();
        }
    }, [user, fetchAppointments]);
    
    const crearReunionMeet = async (appointment: Appointment) => {
        if (!user) return;
        setIsActionLoading(appointment.id);
        
        try {
            const result = await createGoogleMeet({
                appointmentId: appointment.id,
                doctorId: user.uid,
                summary: `Consulta con ${appointment.patientName}`,
                description: `Consulta de Telemedicina para ${appointment.patientName} con ${user.displayName}.`,
                startDateTime: appointment.dateTime.toISOString(),
                attendees: appointment.patientEmail ? [{ email: appointment.patientEmail }] : []
            });

            if (result.needsAuth) {
                // Redirigir al usuario a la URL de autorización de Google
                console.log("Google OAuth Redirect URL:", result.authUrl);
                window.location.href = result.authUrl;
            } else if (result.error) {
                throw new Error(result.error);
            } else {
                // El enlace se habrá actualizado en Firestore y el listener lo recogerá.
                toast({
                    title: "Reunión creada con éxito",
                    description: "El enlace de Google Meet se ha añadido al turno.",
                });
            }
        } catch (error) {
             console.error('Error creating Google Meet:', error);
             toast({
                title: 'Error al crear la reunión',
                description: (error as Error).message || 'No se pudo generar el enlace de Google Meet. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsActionLoading(null);
        }
    };


    const { upcomingAppointments, completedAppointments } = useMemo(() => {
        const upcoming = allAppointments.filter(a => a.status === 'Confirmado');
        const completed = allAppointments.filter(a => a.status === 'Completado');
        return {
            upcomingAppointments: upcoming,
            completedAppointments: completed.sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime()),
        };
    }, [allAppointments]);

    const { nextAppointment, otherAppointments } = useMemo(() => {
        const sortedAppointments = [...upcomingAppointments].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        const now = new Date();
        const futureAppointments = sortedAppointments.filter(appt => appt.dateTime >= now);
        const pastAppointments = sortedAppointments.filter(appt => appt.dateTime < now);
        
        if (futureAppointments.length > 0) {
            return {
                nextAppointment: futureAppointments[0],
                otherAppointments: [...futureAppointments.slice(1), ...pastAppointments]
            };
        }
        return {
            nextAppointment: null,
            otherAppointments: pastAppointments
        };
    }, [upcomingAppointments]);

    const groupedOtherAppointments = useMemo(() => {
        return otherAppointments.reduce((acc, appointment) => {
            const dateKey = appointment.date.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(appointment);
            acc[dateKey].sort((a, b) => a.time.localeCompare(b.time));
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [otherAppointments]);
    
    const sortedOtherDates = Object.keys(groupedOtherAppointments).sort((a, b) => {
        const aDate = new Date(a + 'T00:00:00');
        const bDate = new Date(b + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aIsPast = aDate < today;
        const bIsPast = bDate < today;

        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;

        if (aIsPast) {
            return bDate.getTime() - aDate.getTime();
        } else {
            return aDate.getTime() - bDate.getTime();
        }
    });
    
    const handleOpenNoteDialog = async (appointment: Appointment) => {
        try {
            const mainUserDocRef = doc(db, 'users', appointment.patientId);
            const mainUserDocSnap = await getDoc(mainUserDocRef);

            if (!mainUserDocSnap.exists()) {
                 toast({
                    title: 'Error',
                    description: 'No se encontraron los datos del paciente principal.',
                    variant: 'destructive',
                });
                return;
            }
            
            const mainUserData = mainUserDocSnap.data();
            let patientForNote = { ...mainUserData, name: appointment.patientName, dni: appointment.familyMemberDni || mainUserData.dni };

            if (appointment.familyMemberDni) {
                const familyMember = mainUserData.familyMembers?.find((fm: any) => fm.dni === appointment.familyMemberDni);
                if (familyMember) {
                    patientForNote = {
                        ...familyMember,
                        insuranceCompany: familyMember.insuranceCompany || mainUserData.insuranceCompany,
                        insurancePlan: familyMember.insurancePlan || mainUserData.insurancePlan,
                        insuranceMemberId: familyMember.insuranceMemberId || mainUserData.insuranceMemberId,
                    };
                }
            }

            setPatientDataForNote({
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                patientName: patientForNote.name,
                familyMemberDni: appointment.familyMemberDni,
                dni: patientForNote.dni,
                sex: patientForNote.sex,
                dateOfBirth: patientForNote.dateOfBirth,
                insuranceCompany: patientForNote.insuranceCompany,
                insuranceMemberId: patientForNote.insuranceMemberId,
                insurancePlan: patientForNote.insurancePlan,
            });

            // Fetch clinical notes based on whether it's a family member or the main user
            const notesQuery = appointment.familyMemberDni
                ? query(
                    collection(db, 'clinicalNotes'),
                    where('patientId', '==', appointment.patientId),
                    where('familyMemberDni', '==', appointment.familyMemberDni),
                    orderBy('createdAt', 'desc')
                  )
                : query(
                    collection(db, 'clinicalNotes'),
                    where('patientId', '==', appointment.patientId),
                    where('familyMemberDni', '==', null),
                    orderBy('createdAt', 'desc')
                  );
            
            const notesSnapshot = await getDocs(notesQuery);
            const clinicalNotes: ClinicalNote[] = notesSnapshot.docs.map(doc => {
                 const noteData = doc.data();
                 return {
                    id: doc.id,
                    date: noteData.date,
                    doctorName: noteData.doctorName,
                    content: noteData.note,
                    createdAt: noteData.createdAt?.toDate(),
                 }
            });

            setClinicalHistory(clinicalNotes);
            setIsNoteDialogOpen(true);
           
        } catch (error) {
            console.error('Error fetching patient data for note:', error);
            toast({
                title: 'Error',
                description: 'No se pudo cargar la información del paciente para la nota.',
                variant: 'destructive',
            });
        }
    };
    
    const handleSaveNoteAndComplete = async (note: string) => {
        if (!patientDataForNote || !user) return false;
        
        try {
            // 1. Update appointment status
            const appointmentRef = doc(db, 'appointments', patientDataForNote.appointmentId);
            await updateDoc(appointmentRef, { 
                status: 'Completado',
                isReviewed: false 
            });
            
            // 2. Add clinical note
            await addDoc(collection(db, 'clinicalNotes'), {
                patientId: patientDataForNote.patientId,
                familyMemberDni: patientDataForNote.familyMemberDni || null,
                doctorId: user.uid,
                doctorName: user.displayName,
                appointmentId: patientDataForNote.appointmentId,
                date: new Date().toISOString().split('T')[0],
                note: note,
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Turno Completado y Nota Guardada',
                description: 'La cita ha sido marcada como atendida y la nota se ha añadido al historial del paciente.',
            });
            return true;
        } catch (error) {
            console.error('Error completing appointment and saving note:', error);
            toast({
                title: 'Error',
                description: 'No se pudo actualizar el turno ni guardar la nota.',
                variant: 'destructive',
            });
            return false;
        }
    };


    const AppointmentActions = ({ appointment }: { appointment: Appointment }) => {
        const isLoading = isActionLoading === appointment.id;
        return (
            <div className="flex items-center gap-2">
                {!appointment.meetingUrl ? (
                     <Button size="sm" onClick={() => crearReunionMeet(appointment)} disabled={isLoading}>
                        {isLoading ? (
                            "Creando..."
                        ) : (
                            <>
                                <Video className="mr-2 h-4 w-4" />
                                Crear reunión Meet
                            </>
                        )}
                    </Button>
                ) : (
                    <>
                        <Button asChild size="sm">
                            <Link 
                                href={`${appointment.meetingUrl}`}
                                target="_blank" rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Unirse
                            </Link>
                        </Button>
                        {appointment.patientJoined && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenNoteDialog(appointment)}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Atendida
                            </Button>
                        )}
                    </>
                )}
            </div>
        );
    };

    const UpcomingAppointments = () => (
        <>
            {(nextAppointment || otherAppointments.length > 0) ? (
                <div className="space-y-8">
                    {nextAppointment && (
                        <Card className="border-2 border-primary shadow-lg bg-primary/5">
                             <CardHeader>
                                <CardTitle className="font-headline text-primary flex items-center gap-2">
                                    <CalendarCheck className="h-6 w-6" />
                                    Tu Próximo Turno
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={nextAppointment.patientPhotoUrl} data-ai-hint="person portrait"/>
                                        <AvatarFallback>{nextAppointment.patientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-semibold">{nextAppointment.patientName}</p>
                                            {nextAppointment.patientReady && !nextAppointment.meetingUrl && (
                                                <Badge variant="warning" className="animate-pulse">
                                                    <UserCheck className="mr-1.5 h-3 w-3" />
                                                    Paciente esperando
                                                </Badge>
                                            )}
                                            {nextAppointment.meetingUrl && (
                                                <Badge variant="success">
                                                    <Video className="mr-1.5 h-3 w-3" />
                                                    En consultorio virtual
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-md text-muted-foreground mt-1">
                                             <span className="flex items-center gap-1.5 font-medium">
                                                {new Date(nextAppointment.date.toISOString().split('T')[0] + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
                                             </span>
                                        </div>
                                        <div className="flex items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{nextAppointment.time} hs</span>
                                            <span className="flex items-center gap-1.5"><Video className="h-4 w-4"/>Telemedicina</span>
                                        </div>
                                    </div>
                                </div>
                                <AppointmentActions appointment={nextAppointment} />
                            </CardContent>
                        </Card>
                    )}

                    {otherAppointments.length > 0 && (
                        <div>
                            {nextAppointment && <Separator className="my-8" />}
                            <h3 className="text-xl font-bold font-headline mb-4">
                                {nextAppointment ? 'Siguientes Turnos' : 'Turnos Pendientes'}
                            </h3>
                            <div className="space-y-6">
                                {sortedOtherDates.map(date => (
                                    <div key={date}>
                                        <h4 className="text-md font-semibold font-headline flex items-center gap-2 mb-3 text-muted-foreground">
                                            <CalendarDays className="h-5 w-5" />
                                            {new Date(date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })}
                                        </h4>
                                        <div className="space-y-3">
                                            {groupedOtherAppointments[date].map(appt => (
                                                <Card key={appt.id} className={cn("shadow-sm hover:shadow-md transition-shadow", appt.isDelayed && "border-destructive/20")}>
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12">
                                                                <AvatarImage src={appt.patientPhotoUrl} data-ai-hint="person portrait"/>
                                                                <AvatarFallback>{appt.patientName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold">{appt.patientName}</p>
                                                                    {appt.patientReady && !appt.meetingUrl && (
                                                                        <Badge variant="warning" className="text-xs animate-pulse">
                                                                            <UserCheck className="mr-1 h-3 w-3" />
                                                                            Esperando
                                                                        </Badge>
                                                                    )}
                                                                    {appt.meetingUrl && (
                                                                        <Badge variant="success" className="text-xs">
                                                                            <Video className="mr-1 h-3 w-3" />
                                                                            En consultorio
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{appt.time} hs</span>
                                                                    {appt.isDelayed && (
                                                                        <span className="flex items-center gap-1.5 text-destructive font-semibold">
                                                                            <AlertTriangle className="h-4 w-4" />
                                                                            Turno Demorado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <AppointmentActions appointment={appt} />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="text-center p-10 border-2 border-dashed bg-muted/50">
                    <CardHeader className="p-0">
                        <CardTitle>No tienes turnos próximos</CardTitle>
                        <CardDescription className="mt-2">Cuando los pacientes agenden una cita contigo, aparecerán aquí.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </>
    );

    const HistoryAppointments = () => (
        <>
            {completedAppointments.length > 0 ? (
                <div className="space-y-4">
                    {completedAppointments.map(appt => (
                        <Card key={appt.id} className="shadow-sm bg-muted/30">
                            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={appt.patientPhotoUrl} data-ai-hint="person portrait"/>
                                        <AvatarFallback>{appt.patientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{appt.patientName}</p>
                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarDays className="h-4 w-4" />
                                                {appt.date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })}
                                            </span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{appt.time} hs</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button asChild size="sm" variant="outline">
                                        <Link href={`/dashboard/doctor/patients/${appt.patientId}`}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Ver/Añadir a HC
                                        </Link>
                                    </Button>
                                    <Badge variant="secondary">
                                        <CheckCircle className="mr-1.5 h-3 w-3" />
                                        Atendido
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card className="text-center p-10 border-2 border-dashed bg-muted/50">
                    <CardHeader className="p-0">
                        <CardTitle>No hay turnos atendidos</CardTitle>
                        <CardDescription className="mt-2">Tu historial de consultas completadas aparecerá aquí.</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </>
    );

    return (
        <div className="space-y-8">
            {patientDataForNote && (
                <ClinicalNoteDialog
                    isOpen={isNoteDialogOpen}
                    onOpenChange={setIsNoteDialogOpen}
                    patientData={patientDataForNote}
                    clinicalHistory={clinicalHistory}
                    onSave={handleSaveNoteAndComplete}
                />
            )}
            <div>
                <h2 className="text-2xl font-bold font-headline mb-2">Mi Agenda de Turnos</h2>
                <p className="text-muted-foreground">
                    Gestiona tus citas próximas y revisa tu historial de consultas atendidas.
                </p>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="upcoming">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Próximos y Pendientes
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="mr-2 h-4 w-4" />
                        Historial de Atendidos
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-40 w-full rounded-lg" />
                            <Separator />
                            <Skeleton className="h-8 w-1/3 rounded-lg" />
                            <Card><CardContent className="p-4 space-y-4"><Skeleton className="h-20 w-full rounded-lg" /></CardContent></Card>
                        </div>
                    ) : (
                        <UpcomingAppointments />
                    )}
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                     {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                         </div>
                    ) : (
                        <HistoryAppointments />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

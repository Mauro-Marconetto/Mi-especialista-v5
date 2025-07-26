
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass, Stethoscope } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type AppointmentInfo = {
    doctorName: string;
    doctorSpecialty: string;
    date: string;
    time: string;
};

export default function WaitingRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const appointmentId = params.appointmentId as string;
    const isRedirecting = useRef(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.replace('/login');
            } else {
                setUser(currentUser);
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!user || !appointmentId) return;

        const appointmentRef = doc(db, 'appointments', appointmentId);
        
        // This effect handles cleanup when the user leaves the page.
        const setPatientNotReady = async () => {
             // If we are redirecting because the meeting started, don't set to not ready.
            if (isRedirecting.current) return;
            try {
                await updateDoc(appointmentRef, { patientReady: false });
            } catch (error) {
                // This can fail if the user closes the tab, which is fine.
                // We don't need to show an error for this.
                console.log("Could not set patient as not ready on exit:", error);
            }
        };

        const fetchInitialData = async () => {
            try {
                const docSnap = await getDoc(appointmentRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.patientId !== user.uid) {
                        toast({ title: "Acceso denegado", description: "No tienes permiso para ver esta página.", variant: "destructive" });
                        router.replace('/dashboard/patient/profile');
                        return;
                    }
                    setAppointmentInfo({
                        doctorName: data.doctorName,
                        doctorSpecialty: data.doctorSpecialty,
                        date: new Date(data.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' }),
                        time: data.time,
                    });
                } else {
                     toast({ title: "Turno no encontrado", variant: "destructive" });
                     router.replace('/dashboard/patient/profile');
                }
            } catch (error) {
                console.error("Error fetching initial appointment data:", error);
                toast({ title: "Error al cargar la sala de espera", variant: "destructive" });
                router.replace('/dashboard/patient/profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
        
        const unsubscribeSnapshot = onSnapshot(appointmentRef, async (doc) => {
            if (doc.exists() && !isRedirecting.current) {
                const data = doc.data();
                if (data.meetingUrl) {
                    isRedirecting.current = true;
                    try {
                        await updateDoc(appointmentRef, { patientJoined: true });
                        router.replace(data.meetingUrl);
                    } catch (e) {
                         toast({ title: "Error", description: "No se pudo conectar a la reunión. Inténtalo de nuevo desde tu panel.", variant: "destructive" });
                         router.replace('/dashboard/patient/profile');
                    }
                }
                if (data.status === 'Cancelado') {
                    isRedirecting.current = true;
                    toast({ title: "El turno fue cancelado por el profesional.", variant: "destructive" });
                    router.replace('/dashboard/patient/profile');
                }
            }
        }, (error) => {
            console.error("Error with real-time appointment listener:", error);
            if (!isRedirecting.current) {
                isRedirecting.current = true;
                toast({ title: "Error de conexión", description: "Se perdió la conexión con la sala de espera.", variant: "destructive" });
                router.replace('/dashboard/patient/profile');
            }
        });

        // Add cleanup function to run when the component unmounts
        return () => {
            unsubscribeSnapshot();
            setPatientNotReady();
        };

    }, [user, appointmentId, router, toast]);

    if (isLoading || !appointmentInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted p-4">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                        <Skeleton className="h-5 w-1/2 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 py-12">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-6 w-64 mx-auto" />
                             <Skeleton className="h-5 w-48 mx-auto" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4 text-center">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Sala de Espera Virtual</CardTitle>
                    <CardDescription>
                       Turno con {appointmentInfo.doctorName}
                       <br/>
                       {appointmentInfo.date} a las {appointmentInfo.time} hs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-12">
                    <Hourglass className="h-16 w-16 text-primary animate-spin" />
                    <div className="space-y-1">
                        <p className="text-xl font-semibold">¡Ya le avisamos al profesional!</p>
                        <p className="text-muted-foreground max-w-md">
                            Se unirá a la consulta en cualquier momento. Por favor, mantente en esta página, serás redirigido automáticamente.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

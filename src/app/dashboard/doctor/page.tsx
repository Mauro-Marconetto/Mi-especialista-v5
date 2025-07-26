
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Users, Calendar, Star, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
};

type Stats = {
  upcomingAppointments: number;
  todayAppointments: number;
  monthlyEarnings: number;
  averageRating: number;
  reviewCount: number;
  profileStatus: 'incomplete' | 'pending' | 'pending_update' | 'approved' | null;
};

export default function DoctorDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const appointmentsQuery = query(
                        collection(db, "appointments"),
                        where("doctorId", "==", user.uid)
                    );
                    const appointmentsSnapshot = await getDocs(appointmentsQuery);
                    const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    const doctorDocRef = doc(db, "users", user.uid);
                    const doctorDoc = await getDoc(doctorDocRef);
                    const doctorData = doctorDoc.exists() ? doctorDoc.data() : {};

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const todayString = today.toISOString().split('T')[0];
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                    const upcomingAppointments = appointments.filter(appt => {
                        const apptDate = new Date(appt.date + 'T00:00:00');
                        return apptDate >= today && appt.status === 'Confirmado';
                    }).length;

                    const todayAppointments = appointments.filter(appt => {
                        return appt.date === todayString && appt.status === 'Confirmado';
                    }).length;

                    const monthlyEarnings = appointments.reduce((total, appt) => {
                        const apptDate = new Date(appt.date + 'T00:00:00');
                        const isCompleted = appt.status === 'Completado' || (apptDate < today && appt.status === 'Confirmado');

                        if (isCompleted && apptDate >= firstDayOfMonth) {
                            return total + (appt.price || 0);
                        }
                        return total;
                    }, 0);

                    const calculatedStats: Stats = {
                        upcomingAppointments: upcomingAppointments,
                        todayAppointments: todayAppointments,
                        monthlyEarnings: monthlyEarnings,
                        averageRating: doctorData.rating || 0,
                        reviewCount: doctorData.reviewCount || 0,
                        profileStatus: doctorData.status || 'incomplete',
                    };
                    
                    setStats(calculatedStats);
                    
                    const reviews = (doctorData.reviews || []).slice(0, 3).map((r: any, index: number) => ({
                         id: r.id || `review-${index}`,
                         author: r.author || 'Anónimo',
                         rating: r.rating || 5,
                         comment: r.comment || 'Sin comentario.'
                    }));
                    setRecentReviews(reviews);

                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const StatusAlert = () => {
        if (!stats?.profileStatus) return null;

        switch (stats.profileStatus) {
            case 'pending':
            case 'pending_update':
                 return (
                    <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Perfil Pendiente de Aprobación</AlertTitle>
                        <AlertDescription>
                            Tu perfil está siendo revisado por un administrador y pronto estará visible para los pacientes. No puedes editar tu información mientras se encuentre en este estado.
                        </AlertDescription>
                    </Alert>
                );
            case 'incomplete':
                 return (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Completa tu Perfil para Ser Visible</AlertTitle>
                        <AlertDescription>
                            Tu perfil aún no está completo y no es visible para los pacientes. Ve a la sección <Link href="/dashboard/doctor/profile" className="font-bold underline">Mi Perfil</Link> para cargar toda tu información y enviarla a validación.
                        </AlertDescription>
                    </Alert>
                );
            case 'approved':
                return (
                    <Alert variant="success">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>¡Tu Perfil está Aprobado y Visible!</AlertTitle>
                        <AlertDescription>
                            Los pacientes ya pueden encontrarte y agendar turnos contigo. Recuerda que si modificas datos importantes, tu perfil volverá a revisión.
                        </AlertDescription>
                    </Alert>
                );
            default:
                return null;
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-6">
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-1/2 rounded-lg" />
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                </div>
                <Separator />
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <Card className="mt-8">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <StatusAlert />
            
            <div className="space-y-2">
                <h2 className="text-2xl font-bold font-headline">Resumen de Actividad</h2>
                <p className="text-muted-foreground">Una vista rápida de tu consultorio digital.</p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/doctor/calendar">
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Turnos Próximos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.upcomingAppointments ?? 0}</div>
                            <p className="text-xs text-muted-foreground">Total de turnos por atender</p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Consultas Hoy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats?.todayAppointments ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Turnos agendados para hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(stats?.monthlyEarnings ?? 0).toLocaleString('es-AR')}</div>
                        <p className="text-xs text-muted-foreground">Ingresos brutos este mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.averageRating ?? 0).toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Basado en {stats?.reviewCount ?? 0} reseñas</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Reseñas Recientes
                    </CardTitle>
                    <CardDescription>Las últimas opiniones de tus pacientes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {recentReviews.length > 0 ? (
                        recentReviews.map(review => (
                        <div key={review.id} className="flex items-start gap-4">
                            <div className="flex items-center gap-1 text-sm font-bold">
                                <span>{review.rating.toFixed(1)}</span>
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="flex-1 border-l pl-4">
                                <p className="text-sm text-foreground">"{review.comment}"</p>
                                <p className="text-xs text-muted-foreground mt-1">- {review.author}</p>
                            </div>
                        </div>
                    ))
                    ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Aún no tienes reseñas.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

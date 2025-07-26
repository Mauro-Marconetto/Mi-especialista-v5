
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Stethoscope, CalendarCheck, UserCheck, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { YearlyRevenueChart } from '@/components/admin/YearlyRevenueChart';

type Stats = {
  patients: number;
  doctors: number;
  appointments: number;
  pendingApprovals: number;
  monthlyRevenue: number;
  yearlyRevenueData: { month: string; total: number }[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientsQuery = query(collection(db, 'users'), where('role', '==', 'paciente'));
        const doctorsQuery = query(collection(db, 'users'), where('role', '==', 'profesional'));
        const pendingDoctorsQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'profesional'), 
          where('status', 'in', ['pending', 'pending_update'])
        );
        const appointmentsQuery = query(collection(db, 'appointments'));
        const completedAppointmentsQuery = query(collection(db, 'appointments'), where('status', '==', 'Completado'));
        
        const [
            patientsSnapshot, 
            doctorsSnapshot, 
            appointmentsSnapshot, 
            pendingSnapshot,
            completedAppointmentsSnapshot
        ] = await Promise.all([
          getDocs(patientsQuery),
          getDocs(doctorsQuery),
          getDocs(appointmentsQuery),
          getDocs(pendingDoctorsQuery),
          getDocs(completedAppointmentsQuery)
        ]);
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyRevenue = 0;
        const yearlyRevenueData = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(0, i).toLocaleString('es-AR', { month: 'short' }).replace('.', '').toUpperCase(),
            total: 0,
        }));

        completedAppointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const appointmentDate = new Date(appointment.date);
            const price = appointment.price || 0;

            if (appointmentDate.getFullYear() === currentYear) {
                const month = appointmentDate.getMonth();
                yearlyRevenueData[month].total += price;

                if (month === currentMonth) {
                    monthlyRevenue += price;
                }
            }
        });


        setStats({
          patients: patientsSnapshot.size,
          doctors: doctorsSnapshot.size,
          appointments: appointmentsSnapshot.size,
          pendingApprovals: pendingSnapshot.size,
          monthlyRevenue: monthlyRevenue,
          yearlyRevenueData: yearlyRevenueData,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Pacientes Registrados", value: stats?.patients, icon: Users, href: '/admin/patients' },
    { title: "Profesionales Registrados", value: stats?.doctors, icon: Stethoscope, href: '/admin/professionals' },
    { title: "Consultas Totales", value: stats?.appointments, icon: CalendarCheck, href: null },
    { title: "Ingresos del Mes", value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString('es-AR')}`, icon: DollarSign, href: null },
    { title: "Aprobaciones Pendientes", value: stats?.pendingApprovals, icon: UserCheck, href: '/admin/approvals', highlight: true },
  ];

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold font-headline">Resumen General</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {isLoading ? (
                <>
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </>
            ) : (
                statCards.map((card, index) => {
                    const CardWrapper = card.href ? Link : 'div';
                    const wrapperProps = {
                        ...(card.href && { href: card.href }),
                    };
                    return (
                        <CardWrapper key={index} {...wrapperProps}>
                            <Card className={card.highlight && card.value && Number(card.value) > 0 ? "border-primary bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                    <card.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value ?? 0}</div>
                                    {card.highlight && card.value && Number(card.value) > 0 && <p className="text-xs text-muted-foreground">Haz clic para revisar</p>}
                                </CardContent>
                            </Card>
                        </CardWrapper>
                    )
                })
            )}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Ingresos Generados en el Año</CardTitle>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <Skeleton className="h-80 w-full" />
                ) : (
                    <YearlyRevenueChart data={stats?.yearlyRevenueData || []} />
                )}
            </CardContent>
        </Card>
    </div>
  );
}

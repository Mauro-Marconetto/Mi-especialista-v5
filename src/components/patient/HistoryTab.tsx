
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { PatientAppointment } from "@/lib/placeholder-data";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, History as HistoryIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";

export function HistoryTab() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(true);
        const q = query(
            collection(db, "appointments"), 
            where("patientId", "==", currentUser.uid),
            where("status", "==", "Completado")
        );
        try {
            const querySnapshot = await getDocs(q);
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
                    patientReady: data.patientReady,
                    patientJoined: data.patientJoined,
                    patientName: data.patientName,
                } as PatientAppointment;
            });
            setAppointments(fetchedAppointments);
        } catch(error) {
            console.error("Error fetching patient appointments:", error);
            toast({ title: "Error", description: "No se pudo cargar tu historial de turnos.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
      } else {
          setUser(null);
          setAppointments([]);
          setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  // Dummy handlers as history items are not actionable in this context
  const handleDummyAction = async () => {};
  const handleDummyReschedule = () => {};
  const handleDummyJoin = () => {};

  const filteredAppointments = useMemo(() => {
    const sortedAppointments = [...appointments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (!searchTerm.trim()) {
        return sortedAppointments;
    }
    
    return sortedAppointments.filter(appt => 
        appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appt.patientName && appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [appointments, searchTerm]);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Historial de Turnos Atendidos</CardTitle>
            <CardDescription>
                Aquí puedes ver todas tus citas que fueron completadas.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="w-full max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por profesional o paciente..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardContent>
      </Card>

      {filteredAppointments.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredAppointments.map(appt => (
            <AppointmentCard 
              key={appt.id} 
              appointment={appt}
              onCancel={handleDummyAction}
              onReschedule={handleDummyReschedule}
              onJoinWaitingRoom={handleDummyJoin}
              onJoinMeeting={handleDummyJoin}
              isActionLoading={false}
              user={user}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center p-10 border-2 border-dashed bg-muted/50">
            <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardHeader className="p-0 mt-4">
                <CardTitle>Tu historial está vacío</CardTitle>
                <CardDescription className="mt-2">
                    {searchTerm ? `No se encontraron resultados para "${searchTerm}".` : "Cuando completes turnos, aparecerán aquí."}
                </CardDescription>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}

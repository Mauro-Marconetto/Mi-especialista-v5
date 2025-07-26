
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { PatientList } from "@/components/doctor/PatientList";
import type { PatientListItem } from "@/lib/placeholder-data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DoctorPatientsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [patients, setPatients] = useState<PatientListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchPatients = useCallback(async (currentUser: User) => {
        setIsLoading(true);
        try {
            // 1. Find all appointments for the current doctor
            const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", currentUser.uid));
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            const appointmentsData = appointmentsSnapshot.docs.map(doc => doc.data());

            // 2. Get unique patient account IDs
            const patientAccountIds = new Set<string>(appointmentsData.map(appt => appt.patientId));
            
            if (patientAccountIds.size === 0) {
                setPatients([]);
                return;
            }

            // 3. Fetch all patient account documents in one go
            const patientDocsQuery = query(collection(db, 'users'), where('__name__', 'in', Array.from(patientAccountIds)));
            const patientDocsSnapshot = await getDocs(patientDocsQuery);
            const patientDocsData = new Map(patientDocsSnapshot.docs.map(doc => [doc.id, doc.data()]));

            // 4. Process appointments to create a map of unique patients (including family members)
            const uniquePatients = new Map<string, PatientListItem>();

            for (const appt of appointmentsData) {
                const accountData = patientDocsData.get(appt.patientId);
                if (!accountData) continue;

                const appointmentDate = new Date(appt.date + 'T00:00:00');
                
                if (appt.familyMemberDni) {
                    // It's a family member
                    const familyMember = (accountData.familyMembers || []).find((fm: any) => fm.dni === appt.familyMemberDni);
                    if (familyMember) {
                        const patientKey = `fm-${familyMember.dni}`;
                        const existingPatient = uniquePatients.get(patientKey);
                        const lastVisit = existingPatient ? new Date(Math.max(new Date(existingPatient.lastVisit).getTime(), appointmentDate.getTime())) : appointmentDate;
                        
                        uniquePatients.set(patientKey, {
                            id: accountData.uid,
                            familyMemberDni: familyMember.dni,
                            name: familyMember.name,
                            email: accountData.email, // Contact email is the parent's
                            dni: familyMember.dni,
                            lastVisit: lastVisit.toISOString().split('T')[0],
                            photoUrl: accountData.photoURL || 'https://placehold.co/100x100.png',
                        });
                    }
                } else {
                    // It's the main account holder
                    const patientKey = `user-${accountData.uid}`;
                    const existingPatient = uniquePatients.get(patientKey);
                    const lastVisit = existingPatient ? new Date(Math.max(new Date(existingPatient.lastVisit).getTime(), appointmentDate.getTime())) : appointmentDate;
                    
                    uniquePatients.set(patientKey, {
                        id: accountData.uid,
                        name: accountData.displayName || 'Sin nombre',
                        email: accountData.email || 'N/A',
                        dni: accountData.dni || 'N/A',
                        lastVisit: lastVisit.toISOString().split('T')[0],
                        photoUrl: accountData.photoURL || 'https://placehold.co/100x100.png',
                    });
                }
            }

            const patientsList = Array.from(uniquePatients.values());
            patientsList.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
            
            setPatients(patientsList);

        } catch (error) {
            console.error("Error fetching patients:", error);
            toast({
                title: 'Error',
                description: 'No se pudo cargar la lista de pacientes.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchPatients(currentUser);
            } else {
                setUser(null);
                setPatients([]);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchPatients]);

    const filteredPatients = useMemo(() => {
        const trimmedSearch = searchTerm.trim().toLowerCase();
        if (!trimmedSearch) {
            return patients;
        }
        return patients.filter(patient =>
            patient.name.toLowerCase().includes(trimmedSearch) ||
            patient.dni.toLowerCase().includes(trimmedSearch)
        );
    }, [searchTerm, patients]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Mis Pacientes</h2>
                    <p className="text-muted-foreground">
                        Aquí encontrarás la lista de todos los pacientes que has atendido.
                    </p>
                </div>
                <div className="w-full sm:w-auto sm:max-w-xs relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o DNI..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </div>
            {isLoading ? (
                 <Card>
                    <CardHeader>
                        <CardTitle>Listado de Pacientes</CardTitle>
                         <CardDescription>
                            Cargando pacientes...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            ) : (
                <PatientList patients={filteredPatients} searchTerm={searchTerm.trim()} />
            )}
        </div>
    );
}

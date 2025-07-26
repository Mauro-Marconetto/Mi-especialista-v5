
"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Patient = {
    id: string;
    name: string;
    email: string;
    dni: string;
    createdAt: string;
    photoURL?: string;
};

export default function AdminPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'users'), 
                where('role', '==', 'paciente')
            );
            const querySnapshot = await getDocs(q);
            const patientsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side to avoid needing a composite index in Firestore
            patientsList.sort((a, b) => {
                const dateA = a.createdAt?.toDate();
                const dateB = b.createdAt?.toDate();
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateB.getTime() - dateA.getTime();
            });

            const formattedPatients: Patient[] = patientsList.map(data => ({
                id: data.id,
                name: data.displayName || 'Sin nombre',
                email: data.email || 'N/A',
                dni: data.dni || 'N/A',
                createdAt: data.createdAt?.toDate().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) || 'N/A',
                photoURL: data.photoURL,
            }));
            
            setPatients(formattedPatients);
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
        fetchPatients();
    }, [fetchPatients]);
    
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`;
        }
        return name.substring(0, 2);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pacientes Registrados</CardTitle>
                <CardDescription>
                    Lista de todos los pacientes registrados en la plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Fecha de Registro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-40" /></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                </TableRow>
                            ))
                        ) : patients.length > 0 ? (
                            patients.map((patient) => (
                                <TableRow key={patient.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={patient.photoURL} alt={patient.name} />
                                                <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{patient.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.email}</TableCell>
                                    <TableCell>{patient.dni}</TableCell>
                                    <TableCell>{patient.createdAt}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No hay pacientes registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

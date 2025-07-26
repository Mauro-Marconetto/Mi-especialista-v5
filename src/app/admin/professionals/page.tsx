
"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Professional = {
    id: string;
    name: string;
    email: string;
    specialty: string;
    status: 'approved' | 'pending' | 'incomplete' | 'pending_update';
    createdAt: string;
    photoURL?: string;
};

const statusMap: Record<Professional['status'], { text: string; variant: "default" | "secondary" | "destructive" | "warning" }> = {
    approved: { text: "Aprobado", variant: "default" },
    pending: { text: "Pendiente", variant: "destructive" },
    pending_update: { text: "Pend. Actualización", variant: "warning" },
    incomplete: { text: "Incompleto", variant: "secondary" },
};

export default function AdminProfessionalsPage() {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchProfessionals = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'users'), 
                where('role', '==', 'profesional')
            );
            const querySnapshot = await getDocs(q);
            const professionalsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side to avoid needing a composite index in Firestore
            professionalsList.sort((a, b) => {
                const dateA = a.createdAt?.toDate();
                const dateB = b.createdAt?.toDate();
                if (!dateA) return 1;
                if (!b.createdAt) return -1;
                return dateB.getTime() - dateA.getTime();
            });
            
            const formattedProfessionals: Professional[] = professionalsList.map(data => {
                const specialties = (data.professionalEntries || [])
                    .map((entry: { specialty: string }) => entry.specialty)
                    .join(', ');
                
                return {
                    id: data.id,
                    name: data.displayName || 'Sin nombre',
                    email: data.email || 'N/A',
                    specialty: specialties || 'N/A',
                    status: data.status || 'incomplete',
                    createdAt: data.createdAt?.toDate().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) || 'N/A',
                    photoURL: data.photoURL
                };
            });
            setProfessionals(formattedProfessionals);
        } catch (error) {
            console.error("Error fetching professionals:", error);
            toast({
                title: 'Error',
                description: 'No se pudo cargar la lista de profesionales.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProfessionals();
    }, [fetchProfessionals]);
    
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
                <CardTitle>Profesionales Registrados</CardTitle>
                <CardDescription>
                    Lista de todos los profesionales de la salud registrados en la plataforma.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Especialidad(es)</TableHead>
                            <TableHead>Fecha de Registro</TableHead>
                            <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="flex items-center gap-2"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-5 w-40" /></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : professionals.length > 0 ? (
                            professionals.map((prof) => (
                                <TableRow key={prof.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={prof.photoURL} alt={prof.name} />
                                                <AvatarFallback>{getInitials(prof.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{prof.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{prof.email}</TableCell>
                                    <TableCell>{prof.specialty}</TableCell>
                                    <TableCell>{prof.createdAt}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={statusMap[prof.status].variant}>
                                            {statusMap[prof.status].text}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay profesionales registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

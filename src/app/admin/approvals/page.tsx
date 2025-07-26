
"use client";

import { useEffect, useState, useCallback } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { ApprovalDetailSheet } from '@/components/admin/ApprovalDetailSheet';
import type { Doctor } from '@/lib/placeholder-data';


const fieldTranslations: { [key: string]: string } = {
    displayName: "Nombre",
    dni: "DNI",
    province: "Provincia",
    professionalEntries: "Matrículas",
    billingInfo: "Datos Bancarios",
};

type PendingDoctor = Doctor & {
    id: string;
    email?: string;
    status: 'pending' | 'pending_update';
    modifiedFields?: string[];
};

export default function AdminApprovalsPage() {
    const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);
    const { toast } = useToast();

    const fetchPendingDoctors = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'users'), 
                where('role', '==', 'profesional'), 
                where('status', 'in', ['pending', 'pending_update'])
            );
            const querySnapshot = await getDocs(q);
            const doctorsList: PendingDoctor[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                 const specialties = (data.professionalEntries || [])
                    .map((entry: { specialty: string }) => entry.specialty)
                    .join(', ');
                
                return {
                    ...(data as Doctor),
                    id: doc.id,
                    name: data.displayName || 'Sin nombre', // Map displayName to name
                    email: data.email,
                    specialty: specialties || 'N/A',
                    status: data.status,
                    modifiedFields: data.modifiedFields || []
                };
            });
            setPendingDoctors(doctorsList);
        } catch (error) {
            console.error("Error fetching pending doctors:", error);
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las solicitudes.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPendingDoctors();
    }, [fetchPendingDoctors]);

    const handleApprove = async (doctorId: string) => {
        try {
            const doctorRef = doc(db, 'users', doctorId);
            await updateDoc(doctorRef, {
                status: 'approved',
                modifiedFields: [], // Clear modified fields on approval
            });
            toast({
                title: 'Profesional Aprobado',
                description: 'El perfil ahora será visible en las búsquedas.',
            });
            setSelectedDoctor(null); // Close the sheet
            fetchPendingDoctors(); // Refresh the list
        } catch (error) {
            console.error("Error approving doctor:", error);
            toast({
                title: 'Error',
                description: 'No se pudo aprobar al profesional.',
                variant: 'destructive',
            });
        }
    };
    
    return (
        <>
            <ApprovalDetailSheet 
                doctor={selectedDoctor}
                isOpen={!!selectedDoctor}
                onOpenChange={(isOpen) => !isOpen && setSelectedDoctor(null)}
                onApprove={handleApprove}
                fieldTranslations={fieldTranslations}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Aprobación de Profesionales</CardTitle>
                    <CardDescription>
                        Revisa y aprueba los nuevos perfiles y las actualizaciones de los profesionales para que aparezcan en la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre y Email</TableHead>
                                <TableHead>Tipo de Solicitud</TableHead>
                                <TableHead>Especialidad(es)</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : pendingDoctors.length > 0 ? (
                                pendingDoctors.map((doctor) => (
                                    <TableRow key={doctor.id}>
                                        <TableCell>
                                            <div className="font-medium">{doctor.name}</div>
                                            <div className="text-sm text-muted-foreground">{doctor.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {doctor.status === 'pending_update' ? (
                                                <div>
                                                    <Badge variant="warning">
                                                        <AlertCircle className="mr-1.5 h-3 w-3" />
                                                        Actualización
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Campos: {doctor.modifiedFields?.map(f => fieldTranslations[f] || f).join(', ') || 'N/A'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="outline">
                                                    <CheckCircle className="mr-1.5 h-3 w-3 text-primary" />
                                                    Nuevo Perfil
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{doctor.specialty}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => setSelectedDoctor(doctor)}>
                                                Revisar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No hay solicitudes de aprobación pendientes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}


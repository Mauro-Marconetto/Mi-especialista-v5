
import Link from "next/link";
import Image from "next/image";
import type { PatientListItem } from "@/lib/placeholder-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PatientList({ patients, searchTerm }: { patients: PatientListItem[], searchTerm?: string }) {
    
    const descriptionText = searchTerm
        ? `Mostrando ${patients.length} ${patients.length === 1 ? 'resultado' : 'resultados'} para tu búsqueda.`
        : `Tienes ${patients.length} ${patients.length === 1 ? 'paciente' : 'pacientes'} en tu historial.`;
        
    return (
        <Card>
            <CardHeader>
                <CardTitle>Listado de Pacientes</CardTitle>
                 <CardDescription>
                    {descriptionText}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Paciente</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Email de Contacto</TableHead>
                            <TableHead>Última Consulta</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {patients.length > 0 ? (
                            patients.map((patient) => {
                                const historyLink = patient.familyMemberDni
                                    ? `/dashboard/doctor/patients/${patient.id}?familyMemberDni=${patient.familyMemberDni}`
                                    : `/dashboard/doctor/patients/${patient.id}`;

                                return (
                                <TableRow key={patient.id + (patient.familyMemberDni || '')}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                             <Avatar>
                                                <AvatarImage src={patient.photoUrl} alt={patient.name} data-ai-hint="person portrait" />
                                                <AvatarFallback>
                                                    {patient.name?.charAt(0) || <UserIcon />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{patient.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.dni}</TableCell>
                                    <TableCell>{patient.email}</TableCell>
                                    <TableCell>
                                        {patient.lastVisit && new Date(patient.lastVisit + 'T00:00:00').toLocaleDateString('es-AR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            timeZone: 'America/Argentina/Buenos_Aires',
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={historyLink}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Ver Historia Clínica
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {searchTerm
                                        ? `No se encontraron pacientes que coincidan con "${searchTerm}".` 
                                        : "Aún no tienes un historial de pacientes."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

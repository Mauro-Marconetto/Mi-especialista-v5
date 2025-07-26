
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PatientListItem, ClinicalNote } from "@/lib/placeholder-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Fingerprint, PlusCircle } from "lucide-react";
import { NewClinicalNoteDialog } from "@/components/doctor/NewClinicalNoteDialog";
import { ClinicalHistoryFeed } from "@/components/doctor/ClinicalHistoryFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EditClinicalNoteDialog } from "@/components/doctor/EditClinicalNoteDialog";


export default function PatientHistoryPage() {
  const [patient, setPatient] = useState<PatientListItem | null | undefined>(undefined);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null);
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.patientId as string;
  const familyMemberDni = searchParams.get('familyMemberDni');

  const fetchPatientData = async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
        const patientDocRef = doc(db, 'users', patientId);
        const patientDocSnap = await getDoc(patientDocRef);

        if (!patientDocSnap.exists()) {
            setPatient(null);
            return;
        }

        const data = patientDocSnap.data();
        let patientData: PatientListItem | null = null;
        let notesQuery;

        if (familyMemberDni) {
            const familyMember = (data.familyMembers || []).find((fm: any) => fm.dni === familyMemberDni);
            if (familyMember) {
                patientData = {
                    id: patientDocSnap.id,
                    familyMemberDni: familyMember.dni,
                    name: familyMember.name,
                    email: data.email,
                    dni: familyMember.dni,
                    lastVisit: 'N/A', // This can be enhanced later if needed
                    photoUrl: data.photoURL || 'https://placehold.co/100x100.png',
                };
                notesQuery = query(
                    collection(db, 'clinicalNotes'),
                    where('patientId', '==', patientId),
                    where('familyMemberDni', '==', familyMemberDni)
                );
            } else {
                 setPatient(null); // Family member not found
            }
        } else {
            patientData = {
                id: patientDocSnap.id,
                name: data.displayName || 'Sin nombre',
                email: data.email || 'N/A',
                dni: data.dni || 'N/A',
                lastVisit: data.lastVisit || 'N/A',
                photoUrl: data.photoURL || 'https://placehold.co/100x100.png',
            };
            notesQuery = query(
                collection(db, 'clinicalNotes'),
                where('patientId', '==', patientId),
                where('familyMemberDni', '==', null)
            );
        }
        
        setPatient(patientData);
        
        if (notesQuery) {
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

            clinicalNotes.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
            setNotes(clinicalNotes);
        }

    } catch (error) {
        console.error("Error fetching patient history:", error);
        toast({ title: "Error", description: "No se pudo cargar el historial del paciente.", variant: "destructive" });
        setPatient(null);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, familyMemberDni, toast]);

  const handleEditNote = (note: ClinicalNote) => {
    setEditingNote(note);
  };
  
  const handleSaveNote = async (noteId: string, newContent: string): Promise<boolean> => {
      try {
        const noteRef = doc(db, 'clinicalNotes', noteId);
        await updateDoc(noteRef, { note: newContent });
        toast({ title: 'Consulta actualizada', description: 'La nota clínica ha sido modificada.' });
        fetchPatientData(); // Re-fetch data to show updated content
        return true;
      } catch (error) {
        console.error("Error updating note:", error);
        toast({ title: "Error", description: "No se pudo actualizar la consulta.", variant: "destructive" });
        return false;
      }
  };


  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="md:col-span-1">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (patient === null) {
    notFound();
  }
  
  return (
    <>
      {editingNote && (
        <EditClinicalNoteDialog
          isOpen={!!editingNote}
          onOpenChange={() => setEditingNote(null)}
          note={editingNote}
          onSave={handleSaveNote}
        />
      )}
      {patient && (
        <NewClinicalNoteDialog
            isOpen={isNewNoteDialogOpen}
            onOpenChange={setIsNewNoteDialogOpen}
            patientId={patient.id}
            familyMemberDni={patient.familyMemberDni}
            onNoteAdded={() => {
                fetchPatientData();
                setIsNewNoteDialogOpen(false);
            }}
        />
      )}
      <div className="space-y-6">
          <Link href="/dashboard/doctor/patients" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado de pacientes
          </Link>

          <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start gap-6">
                   <Image
                    src={patient.photoUrl}
                    alt={patient.name}
                    width={100}
                    height={100}
                    className="rounded-full border-4 border-primary/20"
                    data-ai-hint="person portrait"
                  />
                  <div className="flex-1">
                      <CardTitle className="text-2xl font-headline">{patient.name}</CardTitle>
                      <CardDescription>
                          Información del paciente y su historial de consultas.
                      </CardDescription>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                              <Fingerprint className="h-4 w-4" />
                              <span>DNI: {patient.dni}</span>
                          </div>
                           <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{patient.email}</span>
                          </div>
                      </div>
                  </div>
              </CardHeader>
          </Card>

          <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-headline">Registro de consultas</h3>
                <Button onClick={() => setIsNewNoteDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Entrada
                </Button>
              </div>
              <ClinicalHistoryFeed notes={notes} onEdit={handleEditNote} />
          </div>
      </div>
    </>
  );
}

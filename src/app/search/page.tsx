
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DoctorCard } from "@/components/shared/DoctorCard";
import { DoctorSearchForm } from "@/components/forms/DoctorSearchForm";
import type { Doctor } from "@/lib/placeholder-data";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Filter } from "lucide-react";


export default function SearchPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "users"), 
          where("role", "==", "profesional"),
          where("status", "==", "approved")
        );
        const querySnapshot = await getDocs(q);
        const doctorsList: Doctor[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const specialties = (data.professionalEntries || [])
            .map((entry: { specialty: string }) => entry.specialty)
            .join(', ');

          return {
            id: doc.id,
            title: data.title || 'Dr.',
            name: data.displayName || "Nombre no disponible",
            specialty: specialties || "Especialidad no definida",
            province: data.province || "Provincia no definida",
            insurances: data.insurances || [],
            photoURL: data.photoURL || "https://placehold.co/400x400.png",
            bio: data.bio || "Sin biografía disponible.",
            experience: data.experience || [],
            education: data.education || [],
            languages: data.languages || [],
            price: data.price ?? 0,
            rating: data.rating || 4.5,
            reviewCount: data.reviewCount || 0,
            reviews: data.reviews || [],
            weeklyAvailability: data.weeklyAvailability || {},
            appointmentDuration: data.appointmentDuration || 30,
          };
        });
        setDoctors(doctorsList);
      } catch (error) {
        console.error("Error fetching doctors: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
           <div className="md:hidden mb-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="filters">
                  <AccordionTrigger className="text-lg font-semibold font-headline">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtrar Búsqueda
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DoctorSearchForm />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
           </div>
           <div className="hidden md:block sticky top-20">
              <h2 className="text-lg font-semibold mb-4 font-headline">Filtrar Búsqueda</h2>
              <DoctorSearchForm />
           </div>
        </aside>

        <main className="w-full md:w-3/4 lg:w-4/5">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Resultados de la Búsqueda</h1>
            {!isLoading && (
              <p className="text-muted-foreground text-sm sm:text-base">{doctors.length} profesionales encontrados</p>
            )}
          </div>
          <Separator className="mb-6"/>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="flex flex-col h-full overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 p-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="flex-grow space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-4 pt-0 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/50">
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))
              ) : (
                <p className="col-span-full text-muted-foreground text-center py-10">No se encontraron profesionales aprobados que coincidan con la búsqueda.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}



"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter, useParams, useSearchParams } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import type { Doctor } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Star, GraduationCap, Briefcase, Languages, CheckCircle, DollarSign, Clock, ArrowLeft, User, Users, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FamilyMember } from "@/components/patient/FamilyTab";

function DoctorProfileSkeleton() {
  return (
    <div className="bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="h-[150px] w-[150px] rounded-full" />
                <div className="space-y-3 flex-grow">
                  <Skeleton className="h-9 w-3/4" />
                  <Skeleton className="h-7 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </CardContent>
            </Card>
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <aside className="md:col-span-1">
            <div className="sticky top-20">
              <Skeleton className="h-[600px] w-full rounded-lg" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time as HH:MM
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper function to generate time slots
function generateTimeSlots(start: string, end: string, durationInMinutes: number): string[] {
  const slots: string[] = [];
  try {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    
    while (startTime < endTime) {
      slots.push(formatTime(startTime));
      startTime.setMinutes(startTime.getMinutes() + durationInMinutes);
    }
  } catch (e) {
    console.error("Error generating time slots", e);
    return [];
  }
  return slots;
}

const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState<Doctor | null | undefined>(undefined);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<string[]>([]);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<{date: string, time: string} | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("myself");
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const appointmentToRescheduleId = searchParams.get('reschedule');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setFamilyMembers(userDocSnap.data().familyMembers || []);
            }
        }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) {
      setDoctor(null);
      return;
    }
    const fetchDoctor = async () => {
      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === 'profesional') {
          const data = docSnap.data();
          const specialties = (data.professionalEntries || [])
            .map((entry: { specialty: string }) => entry.specialty)
            .join(', ');

          setDoctor({
            id: docSnap.id,
            title: data.title || "Dr.",
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
            status: data.status,
          });
        } else {
          setDoctor(null);
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        setDoctor(null);
      }
    };

    fetchDoctor();
  }, [id]);
  
  useEffect(() => {
    const fetchAppointmentToReschedule = async () => {
        if (appointmentToRescheduleId) {
            try {
                const appointmentRef = doc(db, "appointments", appointmentToRescheduleId);
                const appointmentSnap = await getDoc(appointmentRef);
                if (appointmentSnap.exists()) {
                    const data = appointmentSnap.data();
                    setAppointmentToReschedule({
                        date: data.date,
                        time: data.time,
                    });
                }
            } catch (error) {
                console.error("Error fetching appointment to reschedule:", error);
                toast({
                    title: "Error",
                    description: "No se pudo cargar la información del turno a reprogramar.",
                    variant: "destructive"
                });
            }
        }
    };
    fetchAppointmentToReschedule();
  }, [appointmentToRescheduleId, toast]);

  // Reset selected time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [date]);

  useEffect(() => {
    const fetchBookedAppointments = async () => {
      if (!doctor || !date) return;
      
      const dateString = date.toISOString().split('T')[0];
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctor.id),
        where("date", "==", dateString),
        where("status", "==", "Confirmado")
      );

      try {
        const querySnapshot = await getDocs(q);
        const bookedTimes = querySnapshot.docs.map(doc => doc.data().time as string);
        setBookedAppointments(bookedTimes);
      } catch (error) {
        console.error("Error fetching booked appointments:", error);
        setBookedAppointments([]);
      }
    };
    
    if(doctor) {
        fetchBookedAppointments();
    }
  }, [doctor, date]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableSlots = useMemo(() => {
    if (!date || !doctor?.weeklyAvailability) {
      return [];
    }

    const dayOfWeek = dayMap[date.getDay()];
    const daySchedule = doctor.weeklyAvailability[dayOfWeek];

    if (!daySchedule || !daySchedule.enabled || !daySchedule.slots) {
      return [];
    }

    let allPossibleSlots: string[] = [];
    const duration = doctor.appointmentDuration || 30;

    daySchedule.slots.forEach((slot: { start: string; end: string }) => {
      allPossibleSlots = [
        ...allPossibleSlots,
        ...generateTimeSlots(slot.start, slot.end, duration),
      ];
    });

    const unbookedSlots = allPossibleSlots.filter(
      (slot) => !bookedAppointments.includes(slot)
    );

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      return unbookedSlots.filter((slot) => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTimeInMinutes = slotHour * 60 + slotMinute;
        return slotTimeInMinutes > currentTimeInMinutes;
      });
    }

    return unbookedSlots;
  }, [date, doctor, bookedAppointments]);

  const isDayDisabled = (day: Date): boolean => {
    if (day < today) return true;
    if (!doctor?.weeklyAvailability) return true;
    
    const dayOfWeek = dayMap[day.getDay()];
    const daySchedule = doctor.weeklyAvailability[dayOfWeek];
    
    return !daySchedule || !daySchedule.enabled || !daySchedule.slots || daySchedule.slots.length === 0;
  };
  
  const isRescheduling = !!appointmentToRescheduleId;

  const handleBooking = async () => {
    if (!date || !selectedTime || !doctor || !user) {
        if (!user) {
            toast({
                title: "Necesitas iniciar sesión",
                description: "Para agendar un turno, primero debes ingresar a tu cuenta.",
                variant: "destructive",
            });
            router.push('/login');
        }
        return;
    }

    setIsBooking(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const permanentRole = userDocSnap.exists() ? userDocSnap.data().role : null;
      const activeRole = sessionStorage.getItem('activeRole');

      if (permanentRole === 'profesional' && activeRole !== 'paciente') {
          toast({
              title: "Acción no permitida",
              description: "Los profesionales no pueden agendar turnos en su modo profesional. Cambia a modo paciente desde tu perfil.",
              variant: "destructive",
          });
          router.push('/dashboard/doctor');
          setIsBooking(false);
          return;
      }
      
      const patientData = userDocSnap.exists() ? userDocSnap.data() : {};
      let patientNameForAppointment = patientData.displayName || "Paciente sin nombre";
      let familyMemberDni = null;

      if (selectedPatient !== 'myself') {
          const familyMember = familyMembers.find(fm => fm.dni === selectedPatient);
          if (familyMember) {
              patientNameForAppointment = familyMember.name;
              familyMemberDni = familyMember.dni;
          }
      }

      if (isRescheduling && appointmentToRescheduleId) {
        const appointmentRef = doc(db, "appointments", appointmentToRescheduleId);
        const dataToUpdate = {
            date: date.toISOString().split('T')[0],
            time: selectedTime,
            status: 'Confirmado' as const,
            type: 'Telemedicina' as const,
            location: 'Videoconsulta',
            meetingUrl: null,
            patientJoined: false,
            patientName: patientNameForAppointment,
            familyMemberDni: familyMemberDni,
        };
        await updateDoc(appointmentRef, dataToUpdate);
        toast({
          title: "¡Turno reprogramado!",
          description: `Tu turno con ${doctor.title} ${doctor.name} ha sido cambiado al ${date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} a las ${selectedTime} hs.`,
        });
      } else {
        const patientPhotoUrl = patientData.photoURL || null;

        const appointmentData = {
          doctorId: doctor.id,
          doctorName: `${doctor.title} ${doctor.name}`,
          doctorSpecialty: doctor.specialty,
          doctorPhotoUrl: doctor.photoURL,
          patientId: user.uid,
          patientName: patientNameForAppointment,
          patientEmail: user.email, // Add patient email
          patientPhotoUrl: patientPhotoUrl,
          familyMemberDni: familyMemberDni,
          date: date.toISOString().split('T')[0],
          time: selectedTime,
          type: 'Telemedicina' as const,
          location: 'Videoconsulta',
          status: 'Confirmado' as const,
          createdAt: serverTimestamp(),
          price: doctor.price,
          meetingUrl: null,
          patientJoined: false,
          patientReady: false,
        };

        await addDoc(collection(db, "appointments"), appointmentData);
        toast({
          title: "¡Turno confirmado!",
          description: `El turno para ${patientNameForAppointment} con ${doctor.title} ${doctor.name} el ${date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} a las ${selectedTime} hs ha sido agendado.`,
        });
      }

      router.push('/dashboard/patient/profile');

    } catch (error) {
      console.error("Error creating/updating appointment: ", error);
      toast({
        title: isRescheduling ? "Error al reprogramar" : "Error al agendar",
        description: "No se pudo procesar tu solicitud. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (doctor === undefined) {
    return <DoctorProfileSkeleton />;
  }

  if (!doctor) {
    notFound();
  }

  return (
    <div className="bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {isRescheduling && (
          <Button asChild variant="outline" className="mb-6">
            <Link href="/dashboard/patient/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Mis Turnos
            </Link>
          </Button>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                <Image
                  src={doctor.photoURL}
                  alt={`Foto de ${doctor.title} ${doctor.name}`}
                  width={150}
                  height={150}
                  className="rounded-full border-4 border-primary/20 object-cover"
                  data-ai-hint="doctor portrait"
                />
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <h1 className="text-3xl font-bold font-headline">{doctor.title} {doctor.name}</h1>
                    {doctor.status === 'approved' && (
                        <Badge variant="success">
                            <CheckCircle className="mr-1.5 h-4 w-4" />
                            Profesional Verificado
                        </Badge>
                    )}
                  </div>
                  <p className="text-xl text-primary font-medium">{doctor.specialty}</p>
                   <div className="flex items-center gap-1.5 text-muted-foreground text-sm justify-center sm:justify-start">
                      <MapPin className="h-4 w-4" />
                      <span>{doctor.province}</span>
                    </div>
                  {doctor.price > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm justify-center sm:justify-start">
                      <DollarSign className="h-4 w-4" />
                      <span>{doctor.price.toLocaleString('es-AR')} por consulta</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold">{doctor.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({doctor.reviewCount} opiniones)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="opiniones">Opiniones</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <Card className="shadow-lg">
                  <CardHeader><CardTitle className="font-headline">Sobre el Profesional</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-foreground/80">{doctor.bio}</p>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Briefcase className="text-primary"/>Experiencia</h4>
                      {doctor.experience.length > 0 ? (
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {doctor.experience.map(exp => <li key={exp}>{exp}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No especificado.</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><GraduationCap className="text-primary"/>Formación</h4>
                      {doctor.education.length > 0 ? (
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          {doctor.education.map(edu => <li key={edu}>{edu}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No especificado.</p>
                      )}
                    </div>
                     <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><Languages className="text-primary"/>Idiomas</h4>
                       {doctor.languages.length > 0 ? (
                        <p className="text-muted-foreground">{doctor.languages.map(lang => `${lang.language} (${lang.level})`).join(', ')}</p>
                       ) : (
                        <p className="text-sm text-muted-foreground">No especificado.</p>
                       )}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle className="text-primary"/>Obras Sociales</h4>
                       <div className="flex flex-wrap gap-2">
                          {doctor.insurances.length > 0 ? (
                            doctor.insurances.map(ins => <Badge key={ins} variant="secondary">{ins}</Badge>)
                          ) : (
                            <p className="text-sm text-muted-foreground">No acepta obras sociales.</p>
                          )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="opiniones">
                <Card className="shadow-lg">
                   <CardHeader><CardTitle className="font-headline">Opiniones Verificadas</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     {doctor.reviews.length > 0 ? doctor.reviews.map(review => (
                        <Card key={review.id} className="bg-muted/50">
                           <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                 <p className="font-semibold">{review.author}</p>
                                 <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                       <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                 </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                              <p className="text-xs text-muted-foreground mt-2 text-right">{review.date}</p>
                           </CardContent>
                        </Card>
                     )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Este profesional aún no tiene opiniones.</p>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <aside className="md:col-span-1">
            <div className="sticky top-20">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">{isRescheduling ? "Reprogramar Turno" : "Agendar Turno"}</CardTitle>
                  <CardDescription>
                    {isRescheduling
                      ? `Elige un nuevo horario para tu turno con ${doctor.title} ${doctor.name}`
                      : `Consulta por telemedicina con ${doctor.title} ${doctor.name}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isRescheduling && appointmentToReschedule && (
                     <div className="mb-4 rounded-md border border-accent/50 bg-accent/10 p-3 text-sm text-foreground">
                        <p className="font-semibold">Turno actual:</p>
                        <p>{new Date(appointmentToReschedule.date + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })} a las {appointmentToReschedule.time} hs.</p>
                     </div>
                  )}
                  {doctor.price > 0 ? (
                    <p className="text-2xl font-bold text-center mb-4">${doctor.price.toLocaleString('es-AR')} <span className="text-sm font-normal text-muted-foreground">por consulta</span></p>
                  ) : (
                    <p className="text-muted-foreground text-center mb-4 py-3">Consultar precio</p>
                  )}

                  <h4 className="font-semibold mb-2 text-center flex items-center justify-center gap-2">
                    <User className="h-4 w-4" />
                    ¿Para quién es el turno?
                  </h4>
                  <RadioGroup
                    value={selectedPatient}
                    onValueChange={setSelectedPatient}
                    className="mb-4 grid grid-cols-1 gap-2"
                  >
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <RadioGroupItem value="myself" id="myself" />
                      <Label htmlFor="myself" className="font-medium">Para mí ({user?.displayName || 'Tú'})</Label>
                    </div>
                    {familyMembers.map((member) => (
                      <div key={member.dni} className="flex items-center space-x-2 rounded-md border p-3">
                        <RadioGroupItem value={member.dni} id={member.dni} />
                        <Label htmlFor={member.dni} className="w-full">
                            <div className="flex justify-between">
                                <span className="font-medium">{member.name}</span>
                                <span className="text-xs text-muted-foreground">{member.relationship}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">DNI: {member.dni}</span>
                        </Label>
                      </div>
                    ))}
                    {familyMembers.length === 0 && <p className="text-xs text-muted-foreground text-center p-2">No tienes familiares agregados. <Link href="/dashboard/patient/profile?tab=family" className="underline">Agrégalos aquí</Link>.</p>}
                  </RadioGroup>

                  <h4 className="font-semibold mb-2 text-center flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    Elige fecha y hora
                  </h4>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border p-0"
                    disabled={isDayDisabled}
                    fromMonth={new Date()}
                  />
                  {date && (
                     <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-center flex items-center justify-center gap-2">
                          Horarios disponibles
                        </h4>
                        {availableSlots.length > 0 ? (
                           <div className="grid grid-cols-3 gap-2">
                              {availableSlots.map(slot => (
                                 <Button 
                                    key={slot} 
                                    variant={selectedTime === slot ? 'default' : 'outline'}
                                    onClick={() => setSelectedTime(slot)}
                                >
                                    {slot}
                                </Button>
                              ))}
                           </div>
                        ) : (
                           <p className="text-sm text-muted-foreground text-center">No hay turnos para el día seleccionado.</p>
                        )}
                     </div>
                  )}
                  <Button size="lg" className="w-full mt-6 h-12 text-lg" disabled={!selectedTime || isBooking} onClick={handleBooking}>
                    {isBooking
                      ? isRescheduling ? 'Reprogramando...' : 'Reservando...'
                      : isRescheduling ? 'Confirmar Reprogramación' : 'Reservar Turno'
                    }
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

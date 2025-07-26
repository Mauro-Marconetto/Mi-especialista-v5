
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Users, CalendarClock, Star, Video, HeartPulse, Baby, Stethoscope, Eye, CalendarCheck, PartyPopper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const permanentRole = userData.role;
          const activeRole = sessionStorage.getItem('activeRole') || permanentRole;

          if (activeRole === 'profesional') {
            if (!userData.dni || !userData.phone) {
                router.replace('/dashboard/doctor/profile');
            } else {
                router.replace('/dashboard/doctor');
            }
          } else if (activeRole === 'paciente') {
            router.replace('/dashboard/patient/profile');
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);


  if (isLoading) {
    // Show a skeleton loader to prevent content flashing
    return (
      <div className="flex flex-col">
        <section className="bg-background">
            <div className="container mx-auto px-4 md:px-6 py-20 md:py-32">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-8 w-full mt-4" />
                        <Skeleton className="h-8 w-5/6" />
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Skeleton className="h-12 w-48" />
                            <Skeleton className="h-12 w-36" />
                        </div>
                    </div>
                    <div>
                        <Skeleton className="h-[400px] w-full max-w-[600px] rounded-lg mx-auto" />
                    </div>
                </div>
            </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-background">
        <div className="container mx-auto px-4 md:px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-foreground leading-tight">
                La salud que mereces, al alcance de tu mano.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Encuentra y agenda turnos con los mejores especialistas de forma rápida, segura y confiable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button asChild size="lg" className="h-12 text-lg">
                  <Link href="/search">
                    <Search className="mr-2" />
                    Buscar especialista
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 text-lg">
                  <Link href="/login">
                    Soy profesional
                  </Link>
                </Button>
              </div>
            </div>
            <div>
              <Image
                src="https://placehold.co/600x400.png"
                alt="Doctora sonriendo"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl mx-auto"
                data-ai-hint="happy patient"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center font-headline">¿Por qué elegir Mi Especialista?</h2>
          <p className="mt-2 text-center text-muted-foreground max-w-2xl mx-auto">
            Te conectamos con la salud de una manera más simple, humana y eficiente.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-6">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold">Amplia Red de Especialistas</h3>
              <p className="text-muted-foreground mt-2">Accede a una gran variedad de médicos y especialistas verificados en todo el país.</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <CalendarClock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold">Agenda 24/7</h3>
              <p className="text-muted-foreground mt-2">Reserva tus turnos en cualquier momento y desde cualquier lugar, sin esperas.</p>
            </div>
             <div className="text-center p-6">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold">Opiniones Verificadas</h3>
              <p className="text-muted-foreground mt-2">Lee experiencias de otros pacientes para tomar la mejor decisión para tu salud.</p>
            </div>
             <div className="text-center p-6">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-headline text-xl font-semibold">Telemedicina Segura</h3>
              <p className="text-muted-foreground mt-2">Realiza videoconsultas con tus médicos a través de nuestra plataforma protegida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold font-headline">Tu salud, más simple que nunca</h2>
                <p className="mt-2 text-muted-foreground">Encuentra a tu especialista ideal en 4 simples pasos.</p>
            </div>
            <div className="mt-20 relative">
                {/* The connecting line for desktop */}
                <div className="hidden md:block absolute top-8 left-0 w-full">
                    <div className="w-full border-b-2 border-dashed border-border"></div>
                </div>

                <div className="grid gap-y-12 gap-x-8 md:grid-cols-4 relative">
                    <div className="text-center flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background ring-4 ring-primary">
                                <Search className="h-8 w-8 text-primary" />
                            </div>
                            <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg ring-4 ring-background">1</div>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">Busca</h3>
                        <p className="text-muted-foreground mt-1 text-sm max-w-xs">Usa nuestros filtros para encontrar médicos por especialidad y ubicación.</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background ring-4 ring-primary">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg ring-4 ring-background">2</div>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">Compara y Elige</h3>
                        <p className="text-muted-foreground mt-1 text-sm max-w-xs">Revisa perfiles, opiniones y valores de consultas para tomar la mejor decisión.</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background ring-4 ring-primary">
                                <CalendarCheck className="h-8 w-8 text-primary" />
                            </div>
                             <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg ring-4 ring-background">3</div>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">Agenda tu Turno</h3>
                        <p className="text-muted-foreground mt-1 text-sm max-w-xs">Selecciona un horario disponible en la agenda del médico y reserva.</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                         <div className="relative mb-4">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background ring-4 ring-primary">
                                <PartyPopper className="h-8 w-8 text-primary" />
                            </div>
                             <div className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg ring-4 ring-background">4</div>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">¡Y Listo!</h3>
                        <p className="text-muted-foreground mt-1 text-sm max-w-xs">Tu turno está confirmado. Recibirás un recordatorio por email.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Popular Specialties Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center font-headline">Encuentra al especialista que necesitas</h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Cardiología', icon: HeartPulse },
              { name: 'Pediatría', icon: Baby },
              { name: 'Dermatología', icon: Stethoscope },
              { name: 'Oftalmología', icon: Eye }
            ].map((specialty) => (
              <Link href="/search" key={specialty.name}>
                <Card className="text-center shadow-md hover:shadow-lg transition-shadow hover:-translate-y-1 group">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="bg-primary/10 p-4 rounded-full w-fit mb-4 group-hover:bg-primary transition-colors">
                      <specialty.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <p className="font-semibold font-headline text-lg">{specialty.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href="/search">Ver todas las especialidades</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
             <blockquote className="text-2xl font-semibold leading-snug text-foreground">
                “Mi Especialista transformó la manera en que gestiono mi salud. ¡Encontré un cardiólogo excelente en minutos y agendé mi turno sin complicaciones! Altamente recomendado.”
            </blockquote>
            <p className="mt-4 text-muted-foreground">- Laura S., Paciente Satisfecha</p>
          </div>
        </div>
      </section>

      {/* Professional CTA Section */}
       <section className="bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-20">
          <div className="bg-primary/5 border rounded-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Doctor usando una laptop"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl mx-auto"
                  data-ai-hint="doctor laptop"
                />
              </div>
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-3xl font-bold font-headline text-foreground">¿Eres profesional de la salud?</h2>
                <p className="text-lg text-muted-foreground">
                  Amplía tu alcance, gestiona tu agenda de forma eficiente y conecta con miles de pacientes. Regístrate hoy.
                </p>
                <Button asChild size="lg" className="h-12 text-lg">
                  <Link href="/login">Únete a nuestra red</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

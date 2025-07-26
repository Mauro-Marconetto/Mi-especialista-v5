
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Doctor } from "@/lib/placeholder-data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, DollarSign } from "lucide-react";

type DoctorCardProps = {
  doctor: Doctor;
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleViewProfileClick = () => {
    if (auth.currentUser) {
      router.push(`/doctors/${doctor.id}`);
    } else {
      toast({
        title: "Inicia sesión para continuar",
        description: "Necesitas una cuenta para ver perfiles y agendar turnos.",
        variant: "destructive",
      });
      router.push('/login');
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-col sm:flex-row items-start gap-4 p-4">
        <Image
          src={doctor.photoURL}
          alt={`Foto de ${doctor.title} ${doctor.name}`}
          width={80}
          height={80}
          className="rounded-full border-2 border-primary/50 object-cover mx-auto sm:mx-0"
          data-ai-hint="doctor portrait"
        />
        <div className="flex-grow text-center sm:text-left">
          <h3 className="font-bold text-lg font-headline">{doctor.title} {doctor.name}</h3>
          <p className="text-sm text-primary">{doctor.specialty}</p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground text-xs mt-1">
            <MapPin className="h-3 w-3" />
            <span>{doctor.province}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {doctor.bio}
        </p>

        {doctor.insurances && doctor.insurances.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
                {doctor.insurances.slice(0, 2).map((insurance) => (
                    <Badge key={insurance} variant="secondary" className="font-normal">{insurance}</Badge>
                ))}
                {doctor.insurances.length > 2 && (
                    <Badge variant="outline" className="font-normal">+{doctor.insurances.length - 2} más</Badge>
                )}
            </div>
        )}

        <div className="flex items-center gap-1 mt-4">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold">{doctor.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({doctor.reviewCount} opiniones)</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 border-t mt-auto">
        <div className="w-full flex flex-col items-center gap-3">
             {doctor.price > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-lg font-semibold text-foreground">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>{doctor.price.toLocaleString('es-AR')}</span>
                </div>
            )}
            <Button onClick={handleViewProfileClick} className="w-full">
              Ver Perfil y Agendar
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

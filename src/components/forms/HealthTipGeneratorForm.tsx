"use client";

import { useState } from "react";
import { generateWellnessTips } from "@/ai/flows/generate-health-tips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function HealthTipGeneratorForm() {
  const [specialty, setSpecialty] = useState("");
  const [tips, setTips] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!specialty) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa una especialidad médica.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setTips("");
    try {
      const result = await generateWellnessTips({ medicalSpecialty: specialty });
      setTips(result.wellnessTips);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al generar consejos",
        description: "Hubo un problema con la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Sparkles className="text-primary" />
          Generador de Consejos de Salud
        </CardTitle>
        <CardDescription>
          Ingresa una especialidad médica (ej. Cardiología, Dermatología) para recibir consejos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Especialidad médica..."
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Generando..." : "Generar"}
          </Button>
        </form>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {tips && !isLoading && (
          <Card className="mt-6 bg-accent/20 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent-foreground/80">
                <Lightbulb />
                Consejos de Bienestar para {specialty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accent-foreground/90 whitespace-pre-line">{tips}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Stethoscope, ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";

type Role = 'paciente' | 'profesional';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  if (selectedRole) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background p-4">
        <div className="w-full max-w-md relative">
          <Button 
            variant="ghost" 
            size="sm"
            className="absolute -top-12 left-0 text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedRole(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <AuthForm role={selectedRole} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Bienvenido a Mi Especialista</CardTitle>
          <CardDescription>Selecciona tu tipo de cuenta para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setSelectedRole('paciente')} size="lg" className="w-full h-14 text-base">
            <User className="mr-2" />
            Soy Paciente
          </Button>
          <Button onClick={() => setSelectedRole('profesional')} variant="secondary" size="lg" className="w-full h-14 text-base">
            <Stethoscope className="mr-2" />
            Soy Profesional de la Salud
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg font-headline">Mi Especialista</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Cuidando tu salud, simplificando tu vida.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-2">
            <div>
              <h4 className="font-semibold mb-2">Pacientes</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/search" className="text-muted-foreground hover:text-primary">Buscar médicos</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-primary">Mi cuenta</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Profesionales</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-primary">Acceso profesional</Link></li>
                <li><Link href="/dashboard/doctor/calendar" className="text-muted-foreground hover:text-primary">Gestionar agenda</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Términos y Condiciones</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Política de Privacidad</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Mi Especialista. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

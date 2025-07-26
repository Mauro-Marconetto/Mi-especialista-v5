"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    CalendarCheck, 
    Users, 
    UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
    {
        title: "Resumen",
        href: "/dashboard/doctor",
        icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
        title: "Mis Turnos",
        href: "/dashboard/doctor/calendar",
        icon: <CalendarCheck className="h-4 w-4" />,
    },
    {
        title: "Mis Pacientes",
        href: "/dashboard/doctor/patients",
        icon: <Users className="h-4 w-4" />,
    },
    {
        title: "Mi Perfil",
        href: "/dashboard/doctor/profile",
        icon: <UserCircle className="h-4 w-4" />,
    },
];

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Find the most specific active link by sorting by href length descending
  const activeNav = sidebarNavItems
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname.startsWith(item.href));

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <aside className="lg:w-1/5">
                <h1 className="text-2xl font-bold font-headline mb-6">Panel de Profesional</h1>
                 <nav className="flex flex-col gap-1">
                    {sidebarNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                activeNav?.href === item.href
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {item.icon}
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 lg:border-l lg:pl-12">
                {children}
            </main>
        </div>
    </div>
  );
}

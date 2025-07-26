"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, UserCheck, LogOut, Stethoscope, PanelLeft, Users, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const sidebarNavItems = [
    {
        title: "Resumen",
        href: "/admin",
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        title: "Aprobaciones",
        href: "/admin/approvals",
        icon: <UserCheck className="h-5 w-5" />,
    },
    {
        title: "Profesionales",
        href: "/admin/professionals",
        icon: <Stethoscope className="h-5 w-5" />,
    },
    {
        title: "Pacientes",
        href: "/admin/patients",
        icon: <Users className="h-5 w-5" />,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          router.replace("/admin/login");
        }
      } else {
        router.replace("/admin/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  if (isLoading || (pathname !== '/admin/login' && !isAdmin)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted">
        <Stethoscope className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <aside className={cn(
          "hidden flex-col border-r bg-background sm:flex transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20"
        )}>
          <div className="flex h-16 shrink-0 items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className={cn("font-headline transition-all duration-200", isSidebarOpen ? "opacity-100" : "opacity-0 w-0")}>Admin</span>
            </Link>
          </div>
          <nav className="flex-1 flex flex-col gap-2 p-4 text-sm font-medium">
            {sidebarNavItems.map((item) => (
              <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                       <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary",
                            pathname === item.href && "bg-muted text-primary",
                            !isSidebarOpen && "justify-center"
                          )}
                        >
                          {item.icon}
                          <span className={cn("transition-all duration-200", isSidebarOpen ? "opacity-100" : "opacity-0 w-0")}>{item.title}</span>
                        </Link>
                  </TooltipTrigger>
                  {!isSidebarOpen && (
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  )}
              </Tooltip>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t">
             <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button onClick={handleLogout} variant="ghost" className="w-full">
                        <div className={cn("flex items-center gap-3 w-full", !isSidebarOpen && "justify-center")}>
                             <LogOut className="h-5 w-5" />
                             <span className={cn("transition-all duration-200", isSidebarOpen ? "opacity-100" : "opacity-0 w-0")}>Cerrar Sesión</span>
                        </div>
                    </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                    <TooltipContent side="right">
                      Cerrar Sesión
                    </TooltipContent>
                )}
             </Tooltip>
          </div>
        </aside>
        <div className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-10">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="shrink-0">
                  <PanelLeft className="h-5 w-5"/>
                  <span className="sr-only">Toggle Sidebar</span>
              </Button>
              <h1 className="text-xl font-semibold flex-1">Panel de Administración</h1>
          </header>
          <main className="flex-1 p-4 md:p-6">
              {children}
          </main>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

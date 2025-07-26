
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { Stethoscope, LogIn, LogOut, User as UserIcon, Repeat, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type UserData = {
  role: 'paciente' | 'profesional' | null;
  permanentRole: 'paciente' | 'profesional' | null;
  dni?: string;
  phone?: string;
};

export function Header() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData>({ role: null, permanentRole: null });
  const [isClientReady, setIsClientReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const permanentRole = data.role;
          const sessionRole = sessionStorage.getItem('activeRole') as UserData['role'];
          const activeRole = permanentRole === 'profesional' ? (sessionRole || permanentRole) : permanentRole;

          setUserData({
            role: activeRole,
            permanentRole: permanentRole,
            dni: data.dni,
            phone: data.phone,
          });

          if (activeRole !== sessionStorage.getItem('activeRole')) {
              sessionStorage.setItem('activeRole', activeRole);
          }
        }
      } else {
        setUser(null);
        setUserData({ role: null, permanentRole: null });
        sessionStorage.removeItem('activeRole');
      }
      setIsClientReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('activeRole');
    router.push('/');
  };

  const handleRoleSwitch = () => {
    const newRole = userData.role === 'paciente' ? 'profesional' : 'paciente';
    sessionStorage.setItem('activeRole', newRole);
    setUserData(prev => ({ ...prev, role: newRole }));
    
    router.push(newRole === 'paciente' ? '/search' : '/dashboard/doctor');
    router.refresh(); 
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };
  
  const getHomePath = () => {
    if (!isClientReady || !userData.role) return '/';
    if (userData.role === 'paciente') {
      return '/dashboard/patient/profile';
    }
    if (userData.role === 'profesional') {
      return (!userData.dni || !userData.phone) ? '/dashboard/doctor/profile' : '/dashboard/doctor';
    }
    return '/';
  };
  
  const isAdminPage = pathname.startsWith('/admin');
  if (isAdminPage) {
    return null;
  }

  const navLinks = [
    { href: "/search", label: "Buscar Médicos", roles: ['paciente', 'profesional', null] },
    { href: "/dashboard/doctor", label: "Mi Panel", roles: ['profesional'] },
    { href: "/dashboard/patient/profile", label: "Mis Turnos", roles: ['paciente'] },
  ];

  const MobileNav = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Abrir menú</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left">
            <Link href={getHomePath()} className="flex items-center gap-2 mb-8" onClick={() => setIsMobileMenuOpen(false)}>
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg font-headline">Mi Especialista</span>
            </Link>
            <nav className="flex flex-col gap-4">
              {navLinks.filter(link => link.roles.includes(userData.role)).map(link => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                  >
                      {link.label}
                  </Link>
              ))}
            </nav>
        </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto px-4 md:px-6">
        <Link href={getHomePath()} className="flex items-center gap-2 mr-6">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline font-bold text-lg font-headline">Mi Especialista</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.filter(link => link.roles.includes(userData.role)).map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          {!isClientReady ? (
             <Skeleton className="h-10 w-24 rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Usuario'} />
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(userData.role === 'profesional' ? '/dashboard/doctor/profile' : '/dashboard/patient/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                {userData.permanentRole === 'profesional' && (
                    <DropdownMenuItem onClick={handleRoleSwitch}>
                        <Repeat className="mr-2 h-4 w-4" />
                        <span>
                            {userData.role === 'paciente'
                                ? 'Volver a modo Profesional'
                                : 'Navegar como Paciente'}
                        </span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Ingresar
              </Link>
            </Button>
          )}
           <MobileNav />
        </div>
      </div>
    </header>
  );
}

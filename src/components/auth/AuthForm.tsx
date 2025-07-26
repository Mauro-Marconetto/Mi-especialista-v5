
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.4 64.8C317.3 110.3 284.9 96 248 96c-88.8 0-160.1 71.1-160.1 160s71.3 160 160.1 160c97.4 0 134.4-66.2 140.2-99.9H248v-73.4h235.3c4.7 25.8 7.7 54.8 7.7 85.3z"></path>
    </svg>
);

const LoginSchema = z.object({
  email: z.string().email({ message: "Por favor, ingresa un correo válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

const RegisterSchema = z.object({
  email: z.string().email({ message: "Por favor, ingresa un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type AuthFormProps = {
  role: 'paciente' | 'profesional';
};

export function AuthForm({ role }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  const loginForm = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: "", password: "" },
  });
  
  const handleRedirect = (role: 'paciente' | 'profesional', isNewUser = false) => {
    if (role === 'profesional') {
      router.push(isNewUser ? '/dashboard/doctor/profile' : '/dashboard/doctor');
    } else {
      router.push('/dashboard/patient/profile');
    }
  };

  const handleLogin = async (values: z.infer<typeof LoginSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists() || userDoc.data().role !== role) {
        await auth.signOut();
        throw new Error("No tienes permiso para acceder con este rol.");
      }
      toast({ title: "Inicio de sesión exitoso", description: "Bienvenido de nuevo." });
      handleRedirect(role);
    } catch (error: any) {
      let errorMessage = "Ocurrió un error inesperado. Inténtalo de nuevo.";
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Las credenciales son incorrectas. Verifica tu correo y contraseña.';
            break;
          default:
            errorMessage = error.message;
        }
      } else {
        errorMessage = error.message;
      }
      toast({
        title: "Error al ingresar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof RegisterSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      const userData: any = {
        uid: user.uid,
        email: user.email,
        role: role,
        createdAt: serverTimestamp(),
      };
      
      if (role === 'profesional') {
        userData.status = 'incomplete';
      }

      await setDoc(doc(db, "users", user.uid), userData);
      
      toast({ 
        title: "Registro exitoso", 
        description: role === 'profesional' 
          ? "Tu cuenta ha sido creada. Completa tu perfil para enviarlo a validación."
          : "Tu cuenta ha sido creada." 
      });

      handleRedirect(role, true);
    } catch (error: any) {
      let errorMessage = "Ocurrió un error inesperado. Inténtalo de nuevo.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo electrónico ya está en uso.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo electrónico no es válido.';
            break;
          case 'permission-denied':
            errorMessage = 'Error de permisos al guardar datos. Revisa las reglas de seguridad de Firestore.';
            break;
          case 'auth/configuration-not-found':
            errorMessage = 'Método de inicio de sesión no habilitado. Actívalo en la consola de Firebase.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast({
        title: "Error en el registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let isNewUser = false;

      if (userDoc.exists()) {
        if (userDoc.data().role !== role) {
          await auth.signOut();
          throw new Error("Ya tienes una cuenta con un rol diferente.");
        }
      } else {
        isNewUser = true;
        const userData: any = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          createdAt: serverTimestamp(),
        };

        if (role === 'profesional') {
            userData.status = 'incomplete';
        }
        
        await setDoc(userDocRef, userData);
      }
      
      toast({ 
          title: "Inicio de sesión con Google exitoso",
          description: isNewUser && role === 'profesional' 
            ? "Tu cuenta ha sido creada. Completa tu perfil para enviarlo a validación."
            : undefined
      });
      handleRedirect(role, isNewUser);
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "El inicio de sesión fue cancelado. Si no cerraste la ventana intencionalmente, revisa que tu navegador no esté bloqueando las ventanas emergentes."
      } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = "Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente."
      } else if (error.code === 'permission-denied') {
          errorMessage = "Error de permisos al guardar datos. Revisa las reglas de seguridad de Firestore."
      }
      toast({
        title: "Error con Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Ingresar</TabsTrigger>
        <TabsTrigger value="register">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card className="border-t-0 rounded-t-none">
          <CardHeader>
            <CardTitle>Ingresar como {roleDisplay}</CardTitle>
            <CardDescription>
              Usa tu correo electrónico para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                          <FormLabel>Contraseña</FormLabel>
                          <Link href="#" className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary">
                              ¿Olvidaste tu contraseña?
                          </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </Form>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              <GoogleIcon />
              {isLoading ? "Procesando..." : "Continuar con Google"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card className="border-t-0 rounded-t-none">
          <CardHeader>
            <CardTitle>Crear cuenta de {roleDisplay}</CardTitle>
            <CardDescription>
              Completa el formulario para crear una nueva cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                 <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </Form>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">O</span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              <GoogleIcon />
              {isLoading ? "Procesando..." : "Continuar con Google"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

    

  
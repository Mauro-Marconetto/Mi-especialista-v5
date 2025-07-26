
"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, writeBatch, Timestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { PatientAppointment } from "@/lib/placeholder-data";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsTab } from "@/components/patient/AppointmentsTab";
import { ProfileTab } from "@/components/patient/ProfileTab";
import { HistoryTab } from "@/components/patient/HistoryTab";
import { FamilyTab } from "@/components/patient/FamilyTab";
import { ReviewsTab } from "@/components/patient/ReviewsTab";
import { User as UserIcon, Calendar, History, Users, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function PatientProfilePage() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [pendingReviewAppointments, setPendingReviewAppointments] = useState<PatientAppointment[]>([]);
  const { toast } = useToast();

  const fetchPendingReviews = useCallback((currentUser: User) => {
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid),
      where("status", "==", "Completado"),
      where("isReviewed", "==", false)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedAppointments: PatientAppointment[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                doctorName: data.doctorName,
                doctorSpecialty: data.doctorSpecialty,
                date: data.date,
                time: data.time,
                status: data.status,
                doctorId: data.doctorId,
                patientName: data.patientName,
                doctorPhotoUrl: data.doctorPhotoUrl
            } as PatientAppointment;
        });
        fetchedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPendingReviewAppointments(fetchedAppointments);
    }, (error) => {
        console.error("Error fetching pending reviews in real-time:", error);
        toast({ title: "Error", description: "No se pudieron cargar las opiniones pendientes.", variant: "destructive" });
    });

    return unsubscribe;
  }, [toast]);

  const handleSubmitReview = async (appointmentId: string, doctorId: string, rating: number, comment: string) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);
        const doctorRef = doc(db, "users", doctorId);
        const doctorSnap = await getDoc(doctorRef);

        if (doctorSnap.exists()) {
            const doctorData = doctorSnap.data();
            const oldRating = doctorData.rating || 0;
            const reviewCount = doctorData.reviewCount || 0;
            const newAverageRating = ((oldRating * reviewCount) + rating) / (reviewCount + 1);

            const newReview = {
                id: appointmentId,
                author: user.displayName || "Anónimo",
                date: new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                rating: rating,
                comment: comment,
                createdAt: Timestamp.now(),
            };
            const existingReviews = doctorData.reviews || [];
            batch.update(doctorRef, {
                rating: newAverageRating,
                reviewCount: reviewCount + 1,
                reviews: [newReview, ...existingReviews],
            });
        }
        
        const appointmentRef = doc(db, "appointments", appointmentId);
        batch.update(appointmentRef, { isReviewed: true });
        
        await batch.commit();
        toast({
            title: "¡Gracias por tu opinión!",
            description: "Tu reseña ha sido enviada.",
        });
        
    } catch (error) {
         console.error("Error submitting review:", error);
         toast({ title: "Error", description: "No se pudo enviar tu opinión.", variant: "destructive" });
    }
  };

  useEffect(() => {
    let unsubscribeReviews: () => void = () => {};
    let initialTabFromUrl: string | null = null;
  
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      initialTabFromUrl = params.get('tab');
      if (initialTabFromUrl) {
        setActiveTab(initialTabFromUrl);
      }
    }
  
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeReviews) {
        unsubscribeReviews();
      }
  
      if (currentUser) {
        setUser(currentUser);
        unsubscribeReviews = fetchPendingReviews(currentUser);
  
        if (!initialTabFromUrl) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          let fallbackTab = "appointments";
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.dni || !userData.phone) {
              fallbackTab = "profile";
            }
          } else {
            fallbackTab = "profile";
          }
          setActiveTab(fallbackTab);
        }
  
      } else {
        setUser(null);
        setPendingReviewAppointments([]);
      }
  
      setIsLoading(false);
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribeReviews) {
        unsubscribeReviews();
      }
    };
  }, [fetchPendingReviews]);


  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="h-10 w-full max-w-xl mx-auto rounded-lg" />
        <div className="mt-6">
            <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  const pendingReviewsCount = pendingReviewAppointments.length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <ScrollArea className="w-full pb-4">
         <TabsList className="inline-flex h-auto">
            <TabsTrigger value="appointments">
              <Calendar className="mr-2 h-4 w-4" />
              Mis Turnos
            </TabsTrigger>
            <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Historial
            </TabsTrigger>
             <TabsTrigger value="reviews" className="relative">
                <Star className="mr-2 h-4 w-4" />
                Opiniones
                {pendingReviewsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
                        {pendingReviewsCount}
                    </Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="family">
              <Users className="mr-2 h-4 w-4" />
              Mi Familia
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Mi Perfil
            </TabsTrigger>
          </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="appointments" className="mt-6">
        <AppointmentsTab />
      </TabsContent>
      <TabsContent value="history" className="mt-6">
        <HistoryTab />
      </TabsContent>
       <TabsContent value="reviews" className="mt-6">
        <ReviewsTab 
          appointments={pendingReviewAppointments}
          isLoading={isLoading}
          onSubmitReview={handleSubmitReview}
        />
      </TabsContent>
       <TabsContent value="family" className="mt-6">
        <FamilyTab />
      </TabsContent>
      <TabsContent value="profile" className="mt-6">
        <ProfileTab setActiveTab={setActiveTab} />
      </TabsContent>
    </Tabs>
  );
}

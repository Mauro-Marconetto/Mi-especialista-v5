
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Doctor } from "@/lib/placeholder-data";
import { CheckCircle } from "lucide-react";

type PendingDoctor = Doctor & {
    id: string;
    email?: string;
    status: 'pending' | 'pending_update';
    modifiedFields?: string[];
};

interface ApprovalDetailSheetProps {
    doctor: PendingDoctor | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onApprove: (doctorId: string) => void;
    fieldTranslations: { [key: string]: string };
}

const DetailItem = ({ label, value, isHighlighted }: { label: string; value: React.ReactNode; isHighlighted?: boolean }) => (
  <div className={isHighlighted ? 'p-2 bg-yellow-100/50 border-l-4 border-yellow-400 rounded-r-md' : ''}>
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    <div className="text-sm text-gray-600">{value}</div>
  </div>
);

export function ApprovalDetailSheet({ doctor, isOpen, onOpenChange, onApprove, fieldTranslations }: ApprovalDetailSheetProps) {
  if (!doctor) return null;

  const modifiedSet = new Set(doctor.modifiedFields || []);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0">
        <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-headline">Revisar Solicitud de Profesional</SheetTitle>
                    <SheetDescription>
                        Verifica la información del perfil antes de aprobar. Los campos modificados están resaltados.
                    </SheetDescription>
                </SheetHeader>
                
                <Separator />

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Información Personal y de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem label="Nombre Completo" value={doctor.name} isHighlighted={modifiedSet.has('displayName')} />
                        <DetailItem label="Email" value={doctor.email || 'N/A'} />
                        <DetailItem label="DNI" value={doctor.dni || 'N/A'} isHighlighted={modifiedSet.has('dni')} />
                        <DetailItem label="Teléfono" value={doctor.phone || 'N/A'} />
                        <DetailItem label="Provincia" value={doctor.province || 'N/A'} isHighlighted={modifiedSet.has('province')} />
                    </div>
                </div>

                <Separator />
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Matrículas Profesionales</h3>
                    <div className="space-y-2">
                         {(doctor.professionalEntries || []).map((entry, i) => (
                             <Badge key={i} variant="outline" className="text-base p-2">
                                 {entry.specialty}: {entry.license}
                             </Badge>
                         ))}
                    </div>
                    {modifiedSet.has('professionalEntries') && <p className="text-sm text-yellow-600 font-medium">Este campo fue modificado.</p>}
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Información de Perfil Público</h3>
                    <div className="space-y-4">
                        <DetailItem label="Biografía" value={doctor.bio || 'Sin biografía'} />
                        <DetailItem 
                            label="Experiencia" 
                            value={doctor.experience?.length ? 
                                <ul>{doctor.experience.map((e, i) => <li key={i}>- {e}</li>)}</ul> : 'Sin experiencia listada'} 
                        />
                         <DetailItem 
                            label="Formación" 
                            value={doctor.education?.length ? 
                                <ul>{doctor.education.map((e, i) => <li key={i}>- {e}</li>)}</ul> : 'Sin formación listada'} 
                        />
                        <DetailItem 
                            label="Obras Sociales" 
                            value={doctor.insurances?.length ? doctor.insurances.join(', ') : 'No especificadas'} 
                        />
                        <DetailItem label="Precio por Consulta" value={doctor.price ? `$${doctor.price}` : 'No especificado'} />
                    </div>
                </div>
                
                <Separator />
                
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Datos de Facturación</h3>
                    {doctor.billingInfo ? (
                        <div className="flex gap-4">
                           <DetailItem 
                                label={doctor.billingInfo.type?.toUpperCase() || 'Método'} 
                                value={doctor.billingInfo.value || 'N/A'} 
                                isHighlighted={modifiedSet.has('billingInfo')}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No se han cargado datos de facturación.</p>
                    )}
                </div>
            </div>

            <SheetFooter className="p-6 bg-muted/50 border-t sticky bottom-0">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                <Button onClick={() => onApprove(doctor.id)}>
                    <CheckCircle className="mr-2 h-4 w-4"/>
                    Aprobar Profesional
                </Button>
            </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

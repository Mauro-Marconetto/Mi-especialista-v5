import type { ClinicalNote } from "@/lib/placeholder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";

export function ClinicalHistoryFeed({ notes, onEdit }: { notes: ClinicalNote[], onEdit: (note: ClinicalNote) => void }) {
    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
                <p className="text-muted-foreground">No hay consultas en la historia clínica de este paciente.</p>
                <p className="text-sm text-muted-foreground mt-2">Usa el formulario para añadir la primera entrada.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {notes.map((note) => {
                const now = new Date();
                const noteDate = note.createdAt;
                let isEditable = false;

                if (noteDate) {
                    const sixHoursInMillis = 6 * 60 * 60 * 1000;
                    const timeDifference = now.getTime() - noteDate.getTime();
                    isEditable = timeDifference < sixHoursInMillis;
                }

                return (
                    <Card key={note.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-semibold">
                                    Consulta del {new Date(note.date + 'T00:00:00').toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{note.doctorName}</Badge>
                                    {isEditable && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(note)}>
                                            <FileEdit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-sm text-foreground/80 whitespace-pre-line">
                                {note.content}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

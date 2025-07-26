export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Panel de Paciente</h1>
        <p className="text-muted-foreground mb-6">Gestiona tus datos y turnos desde aquí.</p>
        <div className="border-t pt-6">
            {children}
        </div>
    </div>
  );
}

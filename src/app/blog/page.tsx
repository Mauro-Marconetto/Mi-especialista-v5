import { HealthTipGeneratorForm } from "@/components/forms/HealthTipGeneratorForm";

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold font-headline">Blog de Salud y Bienestar</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Utiliza nuestra herramienta de inteligencia artificial para obtener consejos de salud rápidos y confiables sobre diversas especialidades médicas.
        </p>
      </div>
      <div className="max-w-2xl mx-auto mt-8">
        <HealthTipGeneratorForm />
      </div>
    </div>
  );
}

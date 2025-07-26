import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-500 text-center shadow-xl rounded-2xl">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-6xl font-bold tracking-tight text-foreground">
            Hello, World!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <p className="text-2xl text-muted-foreground">¡Hola, Mundo!</p>
        </CardContent>
      </Card>
    </main>
  );
}

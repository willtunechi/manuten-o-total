import { Settings, Wrench, ShieldCheck } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Icon cluster */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
            <Settings className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Wrench className="h-5 w-5 text-accent-foreground" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Manutenção Total
        </h1>

        {/* Subtitle */}
        <p className="max-w-md text-lg text-muted-foreground">
          Sistema completo de gestão de manutenção — organize ordens de serviço, equipamentos e equipes em um só lugar.
        </p>

        {/* Status badge */}
        <div className="mt-2 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Pronto para começar</span>
        </div>
      </div>
    </div>
  );
};

export default Index;

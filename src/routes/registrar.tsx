import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NovaOcorrenciaDialog } from "@/components/NovaOcorrenciaDialog";
import { PlusCircle, ShieldCheck, ClipboardList } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});

function RegistrarPage() {
  const [novaOpen, setNovaOpen] = useState(false);
  const user = useCurrentUser();

  // Abre o diálogo automaticamente na primeira vez
  useEffect(() => {
    if (user?.perfilId === "seguranca") {
      const t = setTimeout(() => setNovaOpen(true), 200);
      return () => clearTimeout(t);
    }
  }, [user?.perfilId]);

  return (
    <AppShell>
      <div className="page-container max-w-3xl">
        <div className="space-y-2">
          <p className="eyebrow">Segurança</p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Registrar ocorrência
          </h1>
          <p className="text-sm text-muted-foreground">
            Use o botão abaixo para abrir um novo registro. Data e hora são
            preenchidas automaticamente.
          </p>
        </div>

        <Card className="mt-8 overflow-hidden border-2 border-dashed">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center sm:p-12">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-semibold">
                Pronto para registrar
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Todos os registros são enviados à Direção, que acompanha,
                edita e organiza cada ocorrência.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 w-full max-w-xs text-sm font-semibold"
              onClick={() => setNovaOpen(true)}
            >
              <PlusCircle className="h-5 w-5" />
              Nova ocorrência
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Acesso restrito à Segurança
            </p>
          </CardContent>
        </Card>
      </div>

      <NovaOcorrenciaDialog open={novaOpen} onOpenChange={setNovaOpen} />
    </AppShell>
  );
}

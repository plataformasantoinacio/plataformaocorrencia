import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NivelBadge } from "@/components/NivelBadge";
import { OcorrenciaDetailDialog } from "@/components/OcorrenciaDetailDialog";
import { useOcorrencias } from "@/lib/ocorrencias-store";
import { useCurrentUser } from "@/lib/auth";
import { formatDate, type Ocorrencia } from "@/lib/mock-data";
import { Search, ClipboardList, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/minhas")({
  component: MinhasOcorrencias,
});

function MinhasOcorrencias() {
  const ocorrencias = useOcorrencias();
  const user = useCurrentUser();
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Ocorrencia | null>(null);

  const minhas = useMemo(() => {
    const nome = user?.nome ?? "";
    return ocorrencias
      .filter((o) => o.registradoPor === nome)
      .filter((o) => {
        if (!busca.trim()) return true;
        const q = busca.toLowerCase();
        return (
          o.alunoNome.toLowerCase().includes(q) ||
          o.tipo.toLowerCase().includes(q) ||
          o.local.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [ocorrencias, user?.nome, busca]);

  return (
    <AppShell>
      <div className="page-container max-w-5xl">
        <div className="space-y-2">
          <p className="eyebrow">Segurança</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Minhas ocorrências
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Consulte os registros que você criou. Para corrigir algum erro, envie
            uma mensagem à Direção pelo próprio registro.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, tipo ou local..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          {minhas.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Você ainda não registrou ocorrências.
                </p>
              </CardContent>
            </Card>
          )}

          {minhas.map((o) => {
            const respostas = o.mensagens?.length ?? 0;
            return (
              <Card
                key={o.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelecionada(o)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelecionada(o);
                  }
                }}
                className="cursor-pointer overflow-hidden border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                style={{
                  borderLeftColor:
                    o.nivel === "grave"
                      ? "var(--destructive)"
                      : o.nivel === "media"
                        ? "var(--warning)"
                        : "var(--success)",
                }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-semibold sm:text-lg">
                          {o.alunoNome}
                        </span>
                        {o.turma && (
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                            {o.turma}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-foreground/90">
                        {o.tipo}
                        {o.subtipo && (
                          <span className="text-muted-foreground"> · {o.subtipo}</span>
                        )}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {o.relato}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>📍 {o.local}</span>
                        <span>🕒 {formatDate(o.data)}</span>
                        {respostas > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <MessageSquare className="h-3 w-3" />
                            {respostas} msg
                          </span>
                        )}
                      </div>
                    </div>
                    <NivelBadge nivel={o.nivel} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <OcorrenciaDetailDialog
        ocorrencia={selecionada}
        open={!!selecionada}
        onOpenChange={(o) => !o && setSelecionada(null)}
      />
    </AppShell>
  );
}

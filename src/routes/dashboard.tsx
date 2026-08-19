import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NivelBadge } from "@/components/NivelBadge";
import { Button } from "@/components/ui/button";
import { NovaOcorrenciaDialog } from "@/components/NovaOcorrenciaDialog";
import { OcorrenciaDetailDialog } from "@/components/OcorrenciaDetailDialog";
import {
  formatDate,
  type Ocorrencia,
} from "@/lib/mock-data";
import { useOcorrencias } from "@/lib/ocorrencias-store";
import {
  AlertTriangle,
  ClipboardList,
  Users,
  TrendingUp,
  PlusCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [novaOpen, setNovaOpen] = useState(false);
  const [selecionada, setSelecionada] = useState<Ocorrencia | null>(null);
  const [showRecentes, setShowRecentes] = useState(false);
  const [showRecorrentes, setShowRecorrentes] = useState(false);
  const ocorrencias = useOcorrencias();
  const total = ocorrencias.length;
  const graves = ocorrencias.filter((o) => o.nivel === "grave").length;
  const semana = ocorrencias.filter(
    (o) => Date.now() - new Date(o.data).getTime() < 7 * 86400000,
  ).length;

  // Recorrência: mesma pessoa (nome + turma/posto), 2+ ocorrências
  const counts = ocorrencias.reduce<
    Record<string, { nome: string; turma: string; count: number }>
  >((acc, o) => {
    const turma = (o.turma ?? "").trim();
    const key = `${o.alunoNome.trim().toLowerCase()}|${turma.toLowerCase()}`;
    if (!acc[key]) acc[key] = { nome: o.alunoNome, turma, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {});
  const recorrentes = Object.values(counts)
    .filter((r) => r.count >= 2)
    .sort((a, b) => b.count - a.count);

  const recentes = [...ocorrencias]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  return (
    <AppShell>
      <div className="page-container max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">Visão geral</p>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Painel
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Indicadores e atividades recentes do livro de ocorrências.
            </p>
          </div>
          <Button
            size="lg"
            className="h-11 w-full sm:w-auto"
            onClick={() => setNovaOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nova ocorrência</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          <StatCard label="Total de ocorrências" value={total} icon={ClipboardList} tone="primary" />
          <StatCard label="Esta semana" value={semana} icon={TrendingUp} tone="secondary" />
          <StatCard label="Graves" value={graves} icon={AlertTriangle} tone="destructive" />
          <StatCard label="Nomes recorrentes" value={recorrentes.length} icon={Users} tone="gold" />
        </div>


        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0">
                <CardTitle className="font-display text-lg">Ocorrências recentes</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {showRecentes
                    ? "Dados sensíveis visíveis."
                    : "Conteúdo oculto para privacidade."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => setShowRecentes((s) => !s)}
              >
                {showRecentes ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Mostrar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className={showRecentes ? "divide-y" : ""}>
              {!showRecentes ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <EyeOff className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {recentes.length} registro(s) ocultos.
                  </p>
                </div>
              ) : (
                recentes.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelecionada(o)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-start justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.alunoNome}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {o.tipo} · {o.local}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{o.relato}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <NivelBadge nivel={o.nivel} />
                      <span className="text-[11px] text-muted-foreground">{formatDate(o.data)}</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recorrentes */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Atenção especial
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mesmo nome e mesma turma/posto com 2+ ocorrências.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => setShowRecorrentes((s) => !s)}
              >
                {showRecorrentes ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Mostrar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showRecorrentes ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <EyeOff className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {recorrentes.length} registro(s) ocultos.
                  </p>
                </div>
              ) : recorrentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro recorrente.</p>
              ) : (
                recorrentes.map((r) => (
                  <div
                    key={`${r.nome}|${r.turma}`}
                    className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.nome}</p>
                      {r.turma && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.turma}
                        </p>
                      )}
                    </div>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {r.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NovaOcorrenciaDialog open={novaOpen} onOpenChange={setNovaOpen} />
      <OcorrenciaDetailDialog
        ocorrencia={selecionada}
        open={!!selecionada}
        onOpenChange={(o) => !o && setSelecionada(null)}
      />
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "destructive" | "gold";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    destructive: "bg-destructive/10 text-destructive",
    gold: "bg-gold/20 text-gold-foreground",
  }[tone];

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${toneCls}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.16em]">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold leading-none sm:text-2xl md:text-3xl">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


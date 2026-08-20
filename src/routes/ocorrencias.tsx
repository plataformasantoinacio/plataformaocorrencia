import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useTransition } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NivelBadge } from "@/components/NivelBadge";
import { OcorrenciaDetailDialog } from "@/components/OcorrenciaDetailDialog";
import { NovaOcorrenciaDialog } from "@/components/NovaOcorrenciaDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, type OcorrenciaNivel, type Ocorrencia } from "@/lib/mock-data";
import { useOcorrencias, deleteOcorrencia } from "@/lib/ocorrencias-store";
import { useCurrentUser } from "@/lib/auth";
import { PlusCircle, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ocorrencias")({
  component: OcorrenciasList,
});

function OcorrenciasList() {
  const ocorrencias = useOcorrencias();
  const user = useCurrentUser();
  const isDirecao = user?.perfilId === "direcao";
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState<OcorrenciaNivel | "todos">("todos");
  const [periodo, setPeriodo] = useState<"todos" | "7" | "30">("todos");
  const [selecionada, setSelecionada] = useState<Ocorrencia | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);
  const [editando, setEditando] = useState<Ocorrencia | null>(null);
  const [excluir, setExcluir] = useState<Ocorrencia | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();

  const filtradas = useMemo(() => {
    const list = Array.isArray(ocorrencias) ? ocorrencias : [];
    return list
      .filter((o) => {
        if (!o) return false;
        if (nivel !== "todos" && o.nivel !== nivel) return false;
        if (periodo !== "todos") {
          const dias = parseInt(periodo);
          const time = new Date(o.data).getTime();
          if (isNaN(time) || Date.now() - time > dias * 86400000) return false;
        }
        if (busca.trim()) {
          const q = busca.toLowerCase();
          return (
            (o.alunoNome || "").toLowerCase().includes(q) ||
            (o.tipo || "").toLowerCase().includes(q) ||
            (o.turma || "").toLowerCase().includes(q) ||
            (o.local || "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [ocorrencias, busca, nivel, periodo]);

  return (
    <AppShell>
      <div className="page-container max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Registro</p>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Ocorrências</h1>
            <p className="text-sm text-muted-foreground">
              {filtradas.length} de {ocorrencias.length} registros.
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

        {/* Filtros */}
        <Card className="mt-8">
          <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por aluno, tipo, turma ou local..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
            <Select value={nivel} onValueChange={(v) => setNivel(v as typeof nivel)}>
              <SelectTrigger className="h-11 md:w-[170px]">
                <Filter className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os níveis</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
              <SelectTrigger className="h-11 md:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="mt-6 space-y-3">
          {filtradas.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma ocorrência encontrada com esses filtros.
                </p>
              </CardContent>
            </Card>
          )}

          {filtradas.map((o) => (
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
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.relato}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>📍 {o.local}</span>
                      <span>🕒 {formatDate(o.data)}</span>
                      <span>👤 {o.registradoPor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <NivelBadge nivel={o.nivel} />
                    {isDirecao && (
                      <div className="ml-auto flex gap-1.5 sm:ml-0 sm:mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditando(o);
                          }}
                          aria-label="Editar ocorrência"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExcluir(o);
                          }}
                          aria-label="Excluir ocorrência"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <OcorrenciaDetailDialog
        ocorrencia={selecionada}
        open={!!selecionada}
        onOpenChange={(o) => !o && setSelecionada(null)}
      />

      <NovaOcorrenciaDialog open={novaOpen} onOpenChange={setNovaOpen} />

      <NovaOcorrenciaDialog
        open={!!editando}
        onOpenChange={(o) => !o && setEditando(null)}
        ocorrencia={editando}
      />

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ocorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro de{" "}
              <strong>{excluir?.alunoNome}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (excluir) {
                  const id = excluir.id;
                  setExcluir(null);
                  startDeleteTransition(async () => {
                    try {
                      await deleteOcorrencia(id);
                      toast.success("Ocorrência excluída.");
                    } catch {
                      toast.error("Erro ao excluir. Tente novamente.");
                    }
                  });
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

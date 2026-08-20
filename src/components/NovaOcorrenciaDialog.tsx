import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  tiposOcorrencia,
  locaisOcorrencia,
  type OcorrenciaNivel,
  type Ocorrencia,
} from "@/lib/mock-data";
import { addOcorrencia, updateOcorrencia } from "@/lib/ocorrencias-store";
import { readCurrentUser } from "@/lib/auth";
import { Save, AlertTriangle, AlertCircle, Info, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export function NovaOcorrenciaDialog({
  open,
  onOpenChange,
  ocorrencia,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ocorrencia?: Ocorrencia | null;
}) {
  const isEdit = !!ocorrencia;
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("");
  const [tipo, setTipo] = useState("");
  const [tipoOutro, setTipoOutro] = useState("");
  const [subtipo, setSubtipo] = useState("");
  const [local, setLocal] = useState("");
  const [localOutro, setLocalOutro] = useState("");
  const [relato, setRelato] = useState("");
  const [nivel, setNivel] = useState<OcorrenciaNivel | "">("");

  useEffect(() => {
    if (!open) return;
    if (ocorrencia) {
      setNome(ocorrencia.alunoNome);
      setTurma(ocorrencia.turma ?? "");
      const tipoPadrao = tiposOcorrencia.includes(
        ocorrencia.tipo as (typeof tiposOcorrencia)[number],
      );
      setTipo(tipoPadrao ? ocorrencia.tipo : "Outros");
      setTipoOutro(tipoPadrao ? "" : ocorrencia.tipo);
      setSubtipo(ocorrencia.subtipo ?? "");
      const localPadrao = locaisOcorrencia.includes(
        ocorrencia.local as (typeof locaisOcorrencia)[number],
      );
      setLocal(localPadrao ? ocorrencia.local : "Outro");
      setLocalOutro(localPadrao ? "" : ocorrencia.local);
      setRelato(ocorrencia.relato);
      setNivel(ocorrencia.nivel);
    } else {
      setNome("");
      setTurma("");
      setTipo("");
      setTipoOutro("");
      setSubtipo("");
      setLocal("");
      setLocalOutro("");
      setRelato("");
      setNivel("");
    }
  }, [open, ocorrencia]);

  const tipoIsOutros = tipo === "Outros";
  const localIsOutro = local === "Outro";

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = tipoIsOutros ? tipoOutro.trim() : tipo;
    const localFinal = localIsOutro ? localOutro.trim() : local;
    if (
      !nome.trim() ||
      !tipoFinal ||
      !localFinal ||
      !relato.trim() ||
      !nivel
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const currentUser = readCurrentUser();
    const registradoPor =
      ocorrencia?.registradoPor ?? currentUser?.nome ?? "Segurança";

    startTransition(async () => {
      try {
        if (isEdit && ocorrencia) {
          await updateOcorrencia(ocorrencia.id, {
            alunoNome: nome.trim(),
            turma: turma.trim(),
            tipo: tipoFinal,
            subtipo: subtipo.trim() || undefined,
            local: localFinal,
            relato: relato.trim(),
            nivel,
          });
          toast.success("Ocorrência atualizada.");
        } else {
          await addOcorrencia({
            alunoId: "",
            alunoNome: nome.trim(),
            turma: turma.trim(),
            tipo: tipoFinal,
            subtipo: subtipo.trim() || undefined,
            local: localFinal,
            relato: relato.trim(),
            nivel,
            registradoPor,
          });
          toast.success("Ocorrência registrada com sucesso!");
        }
        onOpenChange(false);
      } catch {
        toast.error("Erro ao salvar. Verifique sua conexão e tente novamente.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
        {/* Header */}
        <div className="rounded-t-lg bg-gradient-to-br from-primary to-[oklch(0.4_0.18_25)] p-5 text-white sm:p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              <ClipboardList className="h-3.5 w-3.5" /> {isEdit ? "Edição" : "Registro"}
            </div>
            <DialogTitle className="font-display text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
              {isEdit ? "Editar ocorrência" : "Nova ocorrência"}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/85">
              Data e hora serão registradas automaticamente:{" "}
              <span className="font-semibold text-white">
                {new Date().toLocaleString("pt-BR")}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome-envolvido">Nome (aluno ou funcionário) *</Label>
            <Input
              id="nome-envolvido"
              placeholder="Digite o nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Turma / Posto (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="turma-posto">Turma (aluno) ou posto (funcionário)</Label>
            <Input
              id="turma-posto"
              placeholder="Ex: 9º A, Portaria, Limpeza..."
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Tipo + Subtipo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo-novo">Tipo de ocorrência *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo-novo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tiposOcorrencia.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipoIsOutros && (
                <Input
                  placeholder="Descreva o tipo *"
                  value={tipoOutro}
                  onChange={(e) => setTipoOutro(e.target.value)}
                  autoComplete="off"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtipo-novo">Subtipo (opcional)</Label>
              <Input
                id="subtipo-novo"
                placeholder="Ex: Verbal, Física..."
                value={subtipo}
                onChange={(e) => setSubtipo(e.target.value)}
              />
            </div>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="local-novo">Local *</Label>
            <Select value={local} onValueChange={setLocal}>
              <SelectTrigger id="local-novo">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {locaisOcorrencia.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localIsOutro && (
              <Input
                placeholder="Descreva o local *"
                value={localOutro}
                onChange={(e) => setLocalOutro(e.target.value)}
                autoComplete="off"
              />
            )}
          </div>

          {/* Nível */}
          <div className="space-y-2">
            <Label>Nível *</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <NivelOption
                active={nivel === "baixa"}
                onClick={() => setNivel("baixa")}
                label="Baixa"
                Icon={Info}
                tone="success"
              />
              <NivelOption
                active={nivel === "media"}
                onClick={() => setNivel("media")}
                label="Média"
                Icon={AlertCircle}
                tone="warning"
              />
              <NivelOption
                active={nivel === "grave"}
                onClick={() => setNivel("grave")}
                label="Grave"
                Icon={AlertTriangle}
                tone="destructive"
              />
            </div>
          </div>

          {/* Relato */}
          <div className="space-y-2">
            <Label htmlFor="relato-novo">Relato *</Label>
            <Textarea
              id="relato-novo"
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              placeholder="Descreva o ocorrido com objetividade — o que aconteceu, quem estava envolvido, ações tomadas..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{relato.length} caracteres</p>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : isEdit ? "Salvar alterações" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NivelOption({
  active,
  onClick,
  label,
  Icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "warning" | "destructive";
}) {
  const toneCls = {
    success: "border-success/60 bg-success/10 text-success",
    warning: "border-warning bg-warning/15 text-warning-foreground",
    destructive: "border-destructive/60 bg-destructive/10 text-destructive",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 text-center text-xs font-semibold transition-all sm:gap-1.5 sm:p-3 ${
        active ? toneCls : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

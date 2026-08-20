import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NivelBadge } from "@/components/NivelBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, type Ocorrencia } from "@/lib/mock-data";
import {
  downloadOcorrenciaPdf,
  printOcorrenciaPdf,
  shareOcorrenciaWhatsApp,
} from "@/lib/ocorrencia-pdf";
import { useOcorrencias, addMensagem } from "@/lib/ocorrencias-store";
import { useCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import {
  MapPin,
  Calendar,
  User,
  GraduationCap,
  FileText,
  Download,
  Printer,
  MessageSquare,
  Send,
} from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.511-5.26c.002-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.49-8.413z" />
    </svg>
  );
}

export function OcorrenciaDetailDialog({
  ocorrencia,
  open,
  onOpenChange,
}: {
  ocorrencia: Ocorrencia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const all = useOcorrencias();
  const user = useCurrentUser();
  const [mensagem, setMensagem] = useState("");
  if (!ocorrencia) return null;
  // Sempre usa a versão viva do store para refletir novas mensagens em tempo real.
  const o = all.find((x) => x.id === ocorrencia.id) ?? ocorrencia;
  const isSeguranca = user?.perfilId === "seguranca";
  const mensagens = o.mensagens ?? [];

  const [isPendingMsg, startMsgTransition] = useTransition();

  const enviarMensagem = () => {
    const texto = mensagem.trim();
    if (!texto) return;
    startMsgTransition(async () => {
      try {
        await addMensagem(o.id, { texto, de: user?.nome ?? "Segurança" });
        setMensagem("");
        toast.success("Mensagem enviada à Direção.");
      } catch {
        toast.error("Erro ao enviar mensagem. Tente novamente.");
      }
    });
  };

  const handleDownload = async () => {
    try {
      await downloadOcorrenciaPdf(o);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  };

  const handlePrint = async () => {
    try {
      await printOcorrenciaPdf(o);
    } catch {
      toast.error("Não foi possível abrir a impressão.");
    }
  };

  const handleWhats = async () => {
    try {
      const result = await shareOcorrenciaWhatsApp(o);
      if (!result.shared) {
        toast.info("PDF baixado. Anexe-o no WhatsApp para enviar.");
      }
    } catch {
      toast.error("Não foi possível compartilhar no WhatsApp.");
    }
  };


  const nivelColor =
    o.nivel === "grave"
      ? "var(--destructive)"
      : o.nivel === "media"
        ? "var(--warning)"
        : "var(--success)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
        {/* Header colorido por nível */}
        <div
          className="rounded-t-lg p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${nivelColor}, color-mix(in oklab, ${nivelColor} 70%, black))`,
          }}
        >
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  Registro de ocorrência
                </p>
                <DialogTitle className="mt-2 font-display text-2xl font-bold leading-tight text-white md:text-3xl">
                  {o.tipo}
                  {o.subtipo && (
                    <span className="ml-2 text-lg font-normal text-white/85">
                      · {o.subtipo}
                    </span>
                  )}
                </DialogTitle>
              </div>
              <NivelBadge
                nivel={o.nivel}
                className="flex-shrink-0 border-white/30 bg-white/15 text-white"
              />
            </div>
            <DialogDescription className="text-sm text-white/85">
              Detalhes completos do registro vinculado ao aluno e à ocorrência.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo */}
        <div className="space-y-6 px-5 pb-6 pt-5 sm:px-6">
          {/* Envolvido */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Envolvido
            </p>
            <p className="mt-1 break-words font-display text-lg font-bold">
              {o.alunoNome}
            </p>
            {o.turma && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                <GraduationCap className="mr-1 inline h-3 w-3" />
                Turma {o.turma}
              </p>
            )}
          </div>

          {/* Metadata grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={Calendar} label="Data e hora" value={formatDate(o.data)} />
            <InfoItem icon={MapPin} label="Local" value={o.local} />
            <InfoItem
              icon={User}
              label="Registrado por"
              value={o.registradoPor}
              className="sm:col-span-2"
            />
          </div>

          {/* Relato */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Relato completo
            </p>
            <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed text-foreground/90">
              {o.relato}
            </div>
          </div>

          {/* Ações: PDF / Imprimir / WhatsApp */}
          <div className="rounded-xl border-2 border-dashed bg-muted/20 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Exportar este registro
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button onClick={handleDownload} variant="default" size="sm" className="w-full">
                <Download className="h-4 w-4" />
                <span>Baixar PDF</span>
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="w-full">
                <Printer className="h-4 w-4" />
                <span>Imprimir</span>
              </Button>
              <Button
                onClick={handleWhats}
                size="sm"
                className="w-full bg-[#25D366] text-white hover:bg-[#1ebe57]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>WhatsApp</span>
              </Button>
            </div>
            <p className="mt-2.5 text-[10px] text-muted-foreground">
              O PDF inclui o logotipo do colégio e todas as informações da ocorrência.
            </p>
          </div>

          {/* Mensagens para a Direção */}
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {isSeguranca ? "Mensagens à Direção" : "Mensagens da Segurança"}
            </p>

            {mensagens.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {isSeguranca
                  ? "Nenhuma mensagem enviada ainda."
                  : "Nenhuma mensagem recebida sobre este registro."}
              </p>
            ) : (
              <ul className="space-y-2">
                {mensagens.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border bg-muted/40 p-3 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="truncate">{m.de}</span>
                      <span className="shrink-0">{formatDate(m.data)}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                      {m.texto}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {isSeguranca && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Cometi um erro neste registro. Poderia ajustar..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={enviarMensagem}
                  disabled={!mensagem.trim() || isPendingMsg}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isPendingMsg ? "Enviando..." : "Enviar à Direção"}
                </Button>
              </div>
            )}
          </div>

          {/* ID */}
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Protocolo: {o.id.toUpperCase()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-card p-3 ${className ?? ""}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

import jsPDF from "jspdf";
import logo from "@/assets/logotipo.webp";
import { type Ocorrencia, formatDate, nivelLabel } from "./mock-data";

// Cache do logo já convertido para PNG (data URL) — evita problemas de WEBP no jsPDF
let logoCache: string | null = null;
async function getLogoPngDataUrl(): Promise<string | null> {
  if (logoCache) return logoCache;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logo;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo load fail"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    logoCache = canvas.toDataURL("image/png");
    return logoCache;
  } catch {
    return null;
  }
}

function nivelColor(n: Ocorrencia["nivel"]): [number, number, number] {
  if (n === "grave") return [200, 35, 51]; // vermelho
  if (n === "media") return [217, 119, 6]; // âmbar
  return [21, 128, 61]; // verde
}

export async function buildOcorrenciaPdf(o: Ocorrencia): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const innerWidth = pageWidth - margin * 2;

  // ===== TOPO: Logotipo + cabeçalho do colégio =====
  const logoData = await getLogoPngDataUrl();
  const headerY = margin;
  const headerH = 70;

  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, headerY, 60, 60);
    } catch {
      // ignora se não conseguir
    }
  }

  // Texto do cabeçalho (à direita do logo)
  const textX = margin + 75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("Colégio Santo Inácio", textX, headerY + 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Livro de Ocorrências — Documento oficial", textX, headerY + 38);
  doc.text(
    `Emitido em ${new Date().toLocaleString("pt-BR")}`,
    textX,
    headerY + 52,
  );

  // Linha divisória colorida (por nível)
  const [nr, ng, nb] = nivelColor(o.nivel);
  const lineY = headerY + headerH + 8;
  doc.setDrawColor(nr, ng, nb);
  doc.setLineWidth(2);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  // ===== TÍTULO =====
  let y = lineY + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("Registro de Ocorrência", margin, y);

  // Badge do nível
  const badgeText = `Nível: ${nivelLabel[o.nivel].toUpperCase()}`;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const badgeW = doc.getTextWidth(badgeText) + 16;
  const badgeH = 20;
  const badgeX = pageWidth - margin - badgeW;
  const badgeY = y - 14;
  doc.setFillColor(nr, ng, nb);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, badgeX + 8, badgeY + 13);

  // ID
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Protocolo: ${o.id.toUpperCase()}`, margin, y);

  // ===== DADOS DO ALUNO =====
  y += 28;
  drawSectionTitle(doc, "Envolvido", margin, y, [nr, ng, nb]);
  y += 18;
  drawField(doc, "Nome", o.alunoNome, margin, y, innerWidth);
  y += 32;
  drawTwoCols(
    doc,
    [
      { label: "Turma / Posto", value: o.turma || "—" },
      { label: "Data/Hora", value: formatDate(o.data) },
    ],
    margin,
    y,
    innerWidth,
  );

  // ===== DETALHES =====
  y += 50;
  drawSectionTitle(doc, "Detalhes da ocorrência", margin, y, [nr, ng, nb]);
  y += 18;
  drawTwoCols(
    doc,
    [
      { label: "Tipo", value: o.tipo + (o.subtipo ? ` — ${o.subtipo}` : "") },
      { label: "Local", value: o.local },
    ],
    margin,
    y,
    innerWidth,
  );
  y += 50;
  drawField(doc, "Registrado por", o.registradoPor, margin, y, innerWidth);

  // ===== RELATO =====
  y += 36;
  drawSectionTitle(doc, "Relato completo", margin, y, [nr, ng, nb]);
  y += 16;

  // Caixa de relato com fundo cinza claro
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const relatoLines = doc.splitTextToSize(o.relato, innerWidth - 24);
  const lineHeight = 16;
  const boxH = relatoLines.length * lineHeight + 24;

  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, innerWidth, boxH, 6, 6, "FD");
  doc.text(relatoLines, margin + 12, y + 18);

  y += boxH + 36;

  // ===== ASSINATURAS =====
  if (y > doc.internal.pageSize.getHeight() - 140) {
    doc.addPage();
    y = margin;
  }
  const sigW = (innerWidth - 30) / 2;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 30, margin + sigW, y + 30);
  doc.line(margin + sigW + 30, y + 30, pageWidth - margin, y + 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Direção", margin + sigW / 2, y + 44, { align: "center" });
  doc.text(
    "Responsável pelo aluno",
    margin + sigW + 30 + sigW / 2,
    y + 44,
    { align: "center" },
  );

  // ===== RODAPÉ =====
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Este documento é gerado automaticamente pelo Livro de Ocorrências do Colégio Santo Inácio.",
    pageWidth / 2,
    pageH - 24,
    { align: "center" },
  );

  return doc;
}

function drawSectionTitle(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  color: [number, number, number] = [200, 35, 51],
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(text.toUpperCase(), x, y);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.6);
  doc.line(x, y + 3, x + 40, y + 3);
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  _w: number,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(value, x, y + 16);
}

function drawTwoCols(
  doc: jsPDF,
  fields: { label: string; value: string }[],
  x: number,
  y: number,
  w: number,
) {
  const colW = (w - 24) / 2;
  drawField(doc, fields[0].label, fields[0].value, x, y, colW);
  if (fields[1]) {
    drawField(doc, fields[1].label, fields[1].value, x + colW + 24, y, colW);
  }
}

export async function downloadOcorrenciaPdf(o: Ocorrencia) {
  const doc = await buildOcorrenciaPdf(o);
  const safeName = o.alunoNome.replace(/[^a-zA-Z0-9]+/g, "_");
  doc.save(`ocorrencia_${safeName}_${o.id}.pdf`);
}

export async function printOcorrenciaPdf(o: Ocorrencia) {
  const doc = await buildOcorrenciaPdf(o);
  doc.autoPrint();
  const url = doc.output("bloburl");
  window.open(url.toString(), "_blank");
}

export async function shareOcorrenciaWhatsApp(o: Ocorrencia) {
  const doc = await buildOcorrenciaPdf(o);
  const safeName = o.alunoNome.replace(/[^a-zA-Z0-9]+/g, "_");
  const fileName = `ocorrencia_${safeName}_${o.id}.pdf`;

  const text =
    `*Colégio Santo Inácio* — Registro de Ocorrência\n\n` +
    `*Nome:* ${o.alunoNome}\n` +
    (o.turma ? `*Turma/Posto:* ${o.turma}\n` : "") +
    `*Tipo:* ${o.tipo}${o.subtipo ? ` (${o.subtipo})` : ""}\n` +
    `*Nível:* ${nivelLabel[o.nivel]}\n` +
    `*Data:* ${formatDate(o.data)}\n` +
    `*Local:* ${o.local}\n` +
    `*Registrado por:* ${o.registradoPor}\n\n` +
    `*Relato:*\n${o.relato}\n\n` +
    `_Protocolo: ${o.id.toUpperCase()}_`;

  const blob = doc.output("blob") as Blob;
  const file = new File([blob], fileName, { type: "application/pdf" });

  // Tenta compartilhar o PDF diretamente (mobile / PWA)
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; text?: string; title?: string }) => Promise<void>;
  };
  if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], text, title: "Registro de Ocorrência" });
      return { shared: true } as const;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") {
        return { shared: true } as const;
      }
      // cai para fallback
    }
  }

  // Fallback: baixa PDF + abre WhatsApp com o texto
  doc.save(fileName);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
  return { shared: false } as const;
}

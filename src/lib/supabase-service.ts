/**
 * supabase-service.ts
 * Camada de acesso ao banco de dados Supabase.
 * Todas as operações de CRUD das entidades principais passam por aqui.
 */

import { supabase } from "./supabase";
import type { Aluno, Ocorrencia, OcorrenciaMensagem } from "./mock-data";

// ─── Mapeamento de campos (snake_case do banco ↔ camelCase do front) ──────────

function mapAluno(row: Record<string, unknown>): Aluno {
  return {
    id: row.id as string,
    nome: row.nome as string,
    turma: row.turma as string,
    sala: (row.sala as string) ?? undefined,
    matricula: row.matricula as string,
    foto: (row.foto as string) ?? undefined,
    dataNascimento: (row.data_nascimento as string) ?? undefined,
    responsavel: (row.responsavel as string) ?? undefined,
    telefoneResponsavel: (row.telefone_responsavel as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    observacoes: (row.observacoes as string) ?? undefined,
  };
}

function mapOcorrencia(row: Record<string, unknown>): Ocorrencia {
  const mensagens = Array.isArray(row.ocorrencia_mensagens)
    ? (row.ocorrencia_mensagens as Record<string, unknown>[]).map(mapMensagem)
    : undefined;

  return {
    id: row.id as string,
    alunoId: row.aluno_id as string,
    alunoNome: row.aluno_nome as string,
    turma: row.turma as string,
    tipo: row.tipo as string,
    subtipo: (row.subtipo as string) ?? undefined,
    data: row.data as string,
    local: row.local as string,
    relato: row.relato as string,
    nivel: row.nivel as Ocorrencia["nivel"],
    registradoPor: row.registrado_por as string,
    mensagens,
  };
}

function mapMensagem(row: Record<string, unknown>): OcorrenciaMensagem {
  return {
    id: row.id as string,
    texto: row.texto as string,
    de: row.de as string,
    data: row.data as string,
    lida: (row.lida as boolean) ?? false,
  };
}

// ─── ALUNOS ──────────────────────────────────────────────────────────────────

export async function fetchAlunos(): Promise<Aluno[]> {
  try {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .order("nome");

    if (error) {
      console.error("[Supabase] fetchAlunos:", error.message);
      return [];
    }

    return (data ?? []).map(mapAluno);
  } catch (err) {
    console.error("[Supabase] fetchAlunos crash:", err);
    return [];
  }
}

export async function upsertAluno(aluno: Aluno): Promise<void> {
  const row = {
    id: aluno.id,
    nome: aluno.nome,
    turma: aluno.turma,
    sala: aluno.sala ?? null,
    matricula: aluno.matricula,
    foto: aluno.foto ?? null,
    data_nascimento: aluno.dataNascimento ?? null,
    responsavel: aluno.responsavel ?? null,
    telefone_responsavel: aluno.telefoneResponsavel ?? null,
    email: aluno.email ?? null,
    observacoes: aluno.observacoes ?? null,
  };

  const { error } = await supabase.from("alunos").upsert(row);
  if (error) {
    console.error("[Supabase] upsertAluno:", error.message);
    throw error;
  }
}

// ─── OCORRÊNCIAS ─────────────────────────────────────────────────────────────

export async function fetchOcorrencias(): Promise<Ocorrencia[]> {
  try {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*, ocorrencia_mensagens(*)")
      .order("data", { ascending: false });

    if (error) {
      console.error("[Supabase] fetchOcorrencias:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapOcorrencia(row as Record<string, unknown>));
  } catch (err) {
    console.error("[Supabase] fetchOcorrencias crash:", err);
    return [];
  }
}

export async function insertOcorrencia(
  o: Omit<Ocorrencia, "id" | "data"> & { data?: string },
): Promise<Ocorrencia> {
  const row = {
    id: `o${Date.now().toString(36)}`,
    aluno_id: o.alunoId || null,
    aluno_nome: o.alunoNome,
    turma: o.turma,
    tipo: o.tipo,
    subtipo: o.subtipo ?? null,
    data: o.data ?? new Date().toISOString(),
    local: o.local,
    relato: o.relato,
    nivel: o.nivel,
    registrado_por: o.registradoPor,
  };

  const { data, error } = await supabase
    .from("ocorrencias")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] insertOcorrencia:", error.message);
    throw error;
  }

  return mapOcorrencia(data as Record<string, unknown>);
}

export async function updateOcorrenciaDb(
  id: string,
  patch: Partial<Omit<Ocorrencia, "id">>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.alunoId !== undefined) row.aluno_id = patch.alunoId || null;
  if (patch.alunoNome !== undefined) row.aluno_nome = patch.alunoNome;
  if (patch.turma !== undefined) row.turma = patch.turma;
  if (patch.tipo !== undefined) row.tipo = patch.tipo;
  if (patch.subtipo !== undefined) row.subtipo = patch.subtipo ?? null;
  if (patch.data !== undefined) row.data = patch.data;
  if (patch.local !== undefined) row.local = patch.local;
  if (patch.relato !== undefined) row.relato = patch.relato;
  if (patch.nivel !== undefined) row.nivel = patch.nivel;
  if (patch.registradoPor !== undefined) row.registrado_por = patch.registradoPor;

  const { data, error } = await supabase.from("ocorrencias").update(row).eq("id", id).select();
  if (error) {
    console.error("[Supabase] updateOcorrencia:", error.message);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error("Nenhuma linha atualizada. Verifique as permissões (RLS) de UPDATE no Supabase.");
  }
}

export async function deleteOcorrenciaDb(id: string): Promise<void> {
  const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] deleteOcorrencia:", error.message);
    throw error;
  }
}

// ─── MENSAGENS ────────────────────────────────────────────────────────────────

export async function insertMensagem(
  ocorrenciaId: string,
  msg: Omit<OcorrenciaMensagem, "id" | "data">,
): Promise<OcorrenciaMensagem> {
  const row = {
    id: `m${Date.now().toString(36)}`,
    ocorrencia_id: ocorrenciaId,
    texto: msg.texto,
    de: msg.de,
    lida: msg.lida ?? false,
  };

  const { data, error } = await supabase
    .from("ocorrencia_mensagens")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] insertMensagem:", error.message);
    throw error;
  }

  return mapMensagem(data as Record<string, unknown>);
}

/**
 * ocorrencias-store.ts
 * Store de ocorrências integrado ao Supabase via React Query.
 * Salva automaticamente localmente na plataforma (localStorage + cache)
 * e sincroniza com o banco de dados Supabase em segundo plano.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { supabase } from "./supabase";
import {
  fetchOcorrencias as fetchOcorrenciasDb,
  insertOcorrencia as insertOcorrenciaDb,
  updateOcorrenciaDb,
  deleteOcorrenciaDb,
  insertMensagem as insertMensagemDb,
} from "./supabase-service";
import { ocorrencias as defaultOcorrencias, type Ocorrencia, type OcorrenciaMensagem } from "./mock-data";

export const OCORRENCIAS_KEY = ["ocorrencias"] as const;
const LOCAL_KEY = "csi_ocorrencias";

const broadcast =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("csi_ocorrencias_sync")
    : null;

// ─── Helpers do LocalStorage ──────────────────────────────────────────────────

function loadLocalOcorrencias(): Ocorrencia[] {
  if (typeof window === "undefined") return defaultOcorrencias;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(defaultOcorrencias));
      return defaultOcorrencias;
    }
    const parsed = JSON.parse(raw) as Ocorrencia[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(defaultOcorrencias));
      return defaultOcorrencias;
    }

    const map = new Map<string, Ocorrencia>();
    defaultOcorrencias.forEach((o) => map.set(o.id, o));
    parsed.forEach((o) => map.set(o.id, o));

    return Array.from(map.values());
  } catch {
    return defaultOcorrencias;
  }
}

function persistLocalOcorrencias(list: Ocorrencia[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  if (broadcast) {
    try {
      broadcast.postMessage({ type: "CSI_OCORRENCIAS_UPDATE" });
    } catch {
      /* ignore */
    }
  }
}

// ─── Subscrição Realtime & Storage global ──────────────────────────────────────

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === LOCAL_KEY) {
      void queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    }
  });

  if (broadcast) {
    broadcast.onmessage = (e) => {
      if (e.data?.type === "CSI_OCORRENCIAS_UPDATE") {
        void queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
      }
    };
  }

  supabase
    .channel("ocorrencias-realtime-global")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ocorrencias" },
      () => {
        void queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ocorrencia_mensagens" },
      () => {
        void queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
      },
    )
    .subscribe();
}

// ─── Fetch Principal ─────────────────────────────────────────────────────────

export async function fetchOcorrencias(): Promise<Ocorrencia[]> {
  const localList = loadLocalOcorrencias();

  try {
    const remoteList = await fetchOcorrenciasDb();
    if (remoteList && remoteList.length > 0) {
      const map = new Map<string, Ocorrencia>();
      localList.forEach((o) => map.set(o.id, o));
      remoteList.forEach((o) => map.set(o.id, o));

      const merged = Array.from(map.values());
      persistLocalOcorrencias(merged);
      return merged;
    }
  } catch (err) {
    console.warn("[OcorrenciasStore] Aviso ao sincronizar com banco:", err);
  }

  return localList;
}

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useOcorrencias(): Ocorrencia[] {
  const { data } = useQuery({
    queryKey: OCORRENCIAS_KEY,
    queryFn: fetchOcorrencias,
    staleTime: 10_000,
    initialData: loadLocalOcorrencias,
  });

  return data ?? loadLocalOcorrencias();
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

export function useAddOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: Omit<Ocorrencia, "id" | "data"> & { data?: string }) =>
      addOcorrencia(o),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

export function useUpdateOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<Ocorrencia, "id">>;
    }) => updateOcorrencia(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

export function useDeleteOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOcorrencia(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

export function useAddMensagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ocorrenciaId,
      msg,
    }: {
      ocorrenciaId: string;
      msg: Omit<OcorrenciaMensagem, "id" | "data">;
    }) => addMensagem(ocorrenciaId, msg),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

// ─── Funções imperativas ──────────────────────────────────────────────────────

export async function addOcorrencia(
  o: Omit<Ocorrencia, "id" | "data"> & { data?: string },
): Promise<Ocorrencia> {
  const current = loadLocalOcorrencias();
  const nova: Ocorrencia = {
    id: `o${Date.now().toString(36)}`,
    alunoId: o.alunoId ?? "",
    alunoNome: o.alunoNome,
    turma: o.turma,
    tipo: o.tipo,
    subtipo: o.subtipo,
    data: o.data ?? new Date().toISOString(),
    local: o.local,
    relato: o.relato,
    nivel: o.nivel,
    registradoPor: o.registradoPor,
  };

  const updated = [nova, ...current];
  persistLocalOcorrencias(updated);
  queryClient.setQueryData<Ocorrencia[]>(OCORRENCIAS_KEY, updated);

  try {
    const savedInDb = await insertOcorrenciaDb(o);
    if (savedInDb && savedInDb.id !== nova.id) {
      const final = updated.map((item) => (item.id === nova.id ? savedInDb : item));
      persistLocalOcorrencias(final);
      queryClient.setQueryData<Ocorrencia[]>(OCORRENCIAS_KEY, final);
      return savedInDb;
    }
  } catch (err) {
    console.warn("[OcorrenciasStore] Salvo localmente na plataforma. Supabase aviso:", err);
  }

  return nova;
}

export async function updateOcorrencia(
  id: string,
  patch: Partial<Omit<Ocorrencia, "id">>,
): Promise<void> {
  const current = loadLocalOcorrencias();
  const updated = current.map((item) => (item.id === id ? { ...item, ...patch } : item));
  persistLocalOcorrencias(updated);
  queryClient.setQueryData<Ocorrencia[]>(OCORRENCIAS_KEY, updated);

  try {
    await updateOcorrenciaDb(id, patch);
  } catch (err) {
    console.warn("[OcorrenciasStore] Atualizado localmente na plataforma. Supabase aviso:", err);
  }
}

export async function deleteOcorrencia(id: string): Promise<void> {
  const current = loadLocalOcorrencias();
  const updated = current.filter((o) => o.id !== id);
  persistLocalOcorrencias(updated);
  queryClient.setQueryData<Ocorrencia[]>(OCORRENCIAS_KEY, updated);

  try {
    await deleteOcorrenciaDb(id);
  } catch (err) {
    console.warn("[OcorrenciasStore] Removido localmente na plataforma. Supabase aviso:", err);
  }
}

export async function addMensagem(
  id: string,
  mensagem: Omit<OcorrenciaMensagem, "id" | "data">,
): Promise<void> {
  const current = loadLocalOcorrencias();
  const novaMsg: OcorrenciaMensagem = {
    id: `m${Date.now().toString(36)}`,
    texto: mensagem.texto,
    de: mensagem.de,
    data: new Date().toISOString(),
    lida: mensagem.lida ?? false,
  };

  const updated = current.map((item) => {
    if (item.id === id) {
      const msgs = item.mensagens ?? [];
      return { ...item, mensagens: [...msgs, novaMsg] };
    }
    return item;
  });

  persistLocalOcorrencias(updated);
  queryClient.setQueryData<Ocorrencia[]>(OCORRENCIAS_KEY, updated);

  try {
    await insertMensagemDb(id, mensagem);
  } catch (err) {
    console.warn("[OcorrenciasStore] Mensagem salva localmente na plataforma. Supabase aviso:", err);
  }
}


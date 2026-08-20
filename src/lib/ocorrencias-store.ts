/**
 * ocorrencias-store.ts
 * Store de ocorrências integrado ao Supabase via React Query.
 * Usa Realtime do Supabase para atualizar em tempo real entre abas/usuários.
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { supabase } from "./supabase";
import {
  fetchOcorrencias,
  insertOcorrencia,
  updateOcorrenciaDb,
  deleteOcorrenciaDb,
  insertMensagem,
} from "./supabase-service";
import type { Ocorrencia, OcorrenciaMensagem } from "./mock-data";

export const OCORRENCIAS_KEY = ["ocorrencias"] as const;

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useOcorrencias(): Ocorrencia[] {
  const qc = useQueryClient();

  // Subscrição Realtime do Supabase via useEffect para limpeza correta
  useEffect(() => {
    const channel = supabase
      .channel("ocorrencias-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ocorrencias" },
        () => {
          void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ocorrencia_mensagens" },
        () => {
          void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const { data } = useQuery({
    queryKey: OCORRENCIAS_KEY,
    queryFn: fetchOcorrencias,
    staleTime: 30_000,
  });

  return data ?? [];
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

export function useAddOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: Omit<Ocorrencia, "id" | "data"> & { data?: string }) =>
      insertOcorrencia(o),
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
    }) => updateOcorrenciaDb(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

export function useDeleteOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOcorrenciaDb(id),
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
    }) => insertMensagem(ocorrenciaId, msg),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
    },
  });
}

// ─── Funções imperativas ──────────────────────────────────────────────────────
// Usam o queryClient singleton para invalidar o cache após cada operação,
// mesmo sendo chamadas fora de componentes React.

export async function addOcorrencia(
  o: Omit<Ocorrencia, "id" | "data"> & { data?: string },
): Promise<Ocorrencia> {
  const result = await insertOcorrencia(o);
  await queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
  return result;
}

export async function updateOcorrencia(
  id: string,
  patch: Partial<Omit<Ocorrencia, "id">>,
): Promise<void> {
  await updateOcorrenciaDb(id, patch);
  await queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
}

export async function deleteOcorrencia(id: string): Promise<void> {
  // Optimistic update: remove do cache IMEDIATAMENTE
  const previous = queryClient.getQueryData<Ocorrencia[]>(OCORRENCIAS_KEY);
  queryClient.setQueryData<Ocorrencia[]>(
    OCORRENCIAS_KEY,
    (old) => (old ?? []).filter((o) => o.id !== id),
  );

  try {
    await deleteOcorrenciaDb(id);
  } catch (err) {
    // Falhou → reverte o cache para o estado anterior
    queryClient.setQueryData(OCORRENCIAS_KEY, previous);
    throw err;
  }
}

export async function addMensagem(
  id: string,
  mensagem: Omit<OcorrenciaMensagem, "id" | "data">,
): Promise<void> {
  await insertMensagem(id, mensagem);
  await queryClient.invalidateQueries({ queryKey: OCORRENCIAS_KEY });
}

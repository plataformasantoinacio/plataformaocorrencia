import { useSyncExternalStore } from "react";
import { ocorrencias as seed, type Ocorrencia, type OcorrenciaMensagem } from "./mock-data";

const STORAGE_KEY = "ocorrencias:v1";

function loadInitial(): Ocorrencia[] {
  if (typeof window === "undefined") return [...seed];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Ocorrencia[];
  } catch {
    // ignore
  }
  return [...seed];
}

let data: Ocorrencia[] = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      data = e.newValue ? (JSON.parse(e.newValue) as Ocorrencia[]) : [];
    } catch {
      return;
    }
    listeners.forEach((l) => l());
  });
}

export function addOcorrencia(o: Omit<Ocorrencia, "id" | "data"> & { data?: string }): Ocorrencia {
  const nova: Ocorrencia = {
    ...o,
    id: `o${Date.now().toString(36)}`,
    data: o.data ?? new Date().toISOString(),
  };
  data = [nova, ...data];
  emit();
  return nova;
}

export function updateOcorrencia(id: string, patch: Partial<Omit<Ocorrencia, "id">>) {
  data = data.map((o) => (o.id === id ? { ...o, ...patch } : o));
  emit();
}

export function deleteOcorrencia(id: string) {
  data = data.filter((o) => o.id !== id);
  emit();
}

export function addMensagem(id: string, mensagem: Omit<OcorrenciaMensagem, "id" | "data">) {
  const m: OcorrenciaMensagem = {
    ...mensagem,
    id: `m${Date.now().toString(36)}`,
    data: new Date().toISOString(),
  };
  data = data.map((o) =>
    o.id === id ? { ...o, mensagens: [...(o.mensagens ?? []), m] } : o,
  );
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return data;
}

export function useOcorrencias(): Ocorrencia[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

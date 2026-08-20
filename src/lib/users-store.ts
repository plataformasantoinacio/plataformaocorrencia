import { useState, useEffect } from "react";
import type { PerfilId } from "@/lib/auth";

export type SegurancaUser = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfilId: PerfilId;
  criadoEm: string;
};


const KEY = "csi_users";

function load(): SegurancaUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Partial<SegurancaUser>[];
    return arr.map((u) => ({
      id: u.id ?? `u${Date.now().toString(36)}`,
      nome: u.nome ?? "",
      email: u.email ?? "",
      senha: u.senha ?? "",
      perfilId: (u.perfilId ?? "seguranca") as PerfilId,
      criadoEm: u.criadoEm ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}


let data: SegurancaUser[] = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function addUser(u: Omit<SegurancaUser, "id" | "criadoEm">): SegurancaUser {
  const novo: SegurancaUser = {
    ...u,
    id: `u${Date.now().toString(36)}`,
    criadoEm: new Date().toISOString(),
  };
  data = [novo, ...data];
  persist();
  return novo;
}

export function updateUser(id: string, patch: Partial<Omit<SegurancaUser, "id" | "criadoEm">>) {
  data = data.map((u) => (u.id === id ? { ...u, ...patch } : u));
  persist();
}

export function deleteUser(id: string) {
  data = data.filter((u) => u.id !== id);
  persist();
}

export function findUserByEmail(email: string): SegurancaUser | undefined {
  // Garantir carregamento inicial no cliente se data estiver vazio
  if (data.length === 0 && typeof window !== "undefined") {
    data = load();
  }
  return data.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function emailExists(email: string, ignoreId?: string): boolean {
  if (data.length === 0 && typeof window !== "undefined") {
    data = load();
  }
  return data.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== ignoreId,
  );
}

export function useUsers(): SegurancaUser[] {
  const [users, setUsers] = useState<SegurancaUser[]>([]);

  useEffect(() => {
    setUsers(data);
    const cb = () => setUsers(data);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return users;
}

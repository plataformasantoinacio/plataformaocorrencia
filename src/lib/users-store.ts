import { useState, useEffect } from "react";
import type { PerfilId } from "@/lib/auth";
import { supabase } from "./supabase";
import {
  fetchUsuarios,
  fetchUsuarioByEmailDb,
  insertUsuario,
  updateUsuarioDb,
  deleteUsuarioDb,
} from "./supabase-service";

export type SegurancaUser = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfilId: PerfilId;
  criadoEm: string;
};

const KEY = "csi_users";
const broadcast =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("csi_users_sync")
    : null;

function loadLocal(): SegurancaUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Partial<SegurancaUser>[];
    return arr.map((u) => ({
      id: u.id ?? `u${Date.now().toString(36)}`,
      nome: u.nome ?? "",
      email: (u.email ?? "").trim().toLowerCase(),
      senha: u.senha ?? "",
      perfilId: (u.perfilId ?? "seguranca") as PerfilId,
      criadoEm: u.criadoEm ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

let data: SegurancaUser[] = loadLocal();
const listeners = new Set<() => void>();

function persistLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  if (broadcast) {
    try {
      broadcast.postMessage({ type: "CS_USERS_UPDATE", users: data });
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

if (broadcast) {
  broadcast.onmessage = (event) => {
    if (event.data?.type === "CS_USERS_UPDATE" && Array.isArray(event.data.users)) {
      data = event.data.users;
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    }
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      data = loadLocal();
      listeners.forEach((l) => l());
    }
  });
}

// ─── Subscrição Realtime e Sync com Supabase ────────────────────────────────

export async function syncUsersFromSupabase(): Promise<SegurancaUser[]> {
  try {
    const remote = await fetchUsuarios();
    if (remote && remote.length > 0) {
      const map = new Map<string, SegurancaUser>();
      // Insere os de localStorage
      data.forEach((u) => map.set(u.email.toLowerCase(), u));
      // Sobrescreve/adiciona os do Supabase
      remote.forEach((u) => map.set(u.email.toLowerCase(), u));

      data = Array.from(map.values());
      persistLocal();
    }
  } catch (err) {
    console.error("[UsersStore] syncUsersFromSupabase error:", err);
  }
  return data;
}

if (typeof window !== "undefined") {
  // Inicia busca inicial no Supabase
  void syncUsersFromSupabase();

  // Escuta alterações em tempo real na tabela 'usuarios'
  supabase
    .channel("usuarios-realtime-global")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "usuarios" },
      () => {
        void syncUsersFromSupabase();
      },
    )
    .subscribe();
}

// ─── Operações de Usuários ──────────────────────────────────────────────────

export async function addUser(
  u: Omit<SegurancaUser, "id" | "criadoEm">,
): Promise<SegurancaUser> {
  const cleanEmail = u.email.trim().toLowerCase();
  const tempId = `u${Date.now().toString(36)}`;
  const novo: SegurancaUser = {
    ...u,
    email: cleanEmail,
    id: tempId,
    criadoEm: new Date().toISOString(),
  };

  // Garante salvamento local e transmissão em tempo real imediata
  data = [novo, ...data.filter((x) => x.email.toLowerCase() !== cleanEmail)];
  persistLocal();

  // Tenta salvar no Supabase em segundo plano
  try {
    const created = await insertUsuario({
      nome: u.nome.trim(),
      email: cleanEmail,
      senha: u.senha,
      perfilId: u.perfilId,
    });

    data = data.map((x) => (x.id === tempId ? created : x));
    persistLocal();
    return created;
  } catch (err: unknown) {
    console.warn("[UsersStore] Salvo localmente. Aviso Supabase:", err);
    return novo;
  }
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<SegurancaUser, "id" | "criadoEm">>,
): Promise<void> {
  const cleanPatch = {
    ...patch,
    ...(patch.email ? { email: patch.email.trim().toLowerCase() } : {}),
  };
  data = data.map((u) => (u.id === id ? { ...u, ...cleanPatch } : u));
  persistLocal();

  try {
    await updateUsuarioDb(id, cleanPatch);
  } catch (err) {
    console.warn("[UsersStore] Atualizado localmente. Aviso Supabase:", err);
  }
}

export async function deleteUser(id: string): Promise<void> {
  data = data.filter((u) => u.id !== id);
  persistLocal();

  try {
    await deleteUsuarioDb(id);
  } catch (err) {
    console.warn("[UsersStore] Deletado localmente. Aviso Supabase:", err);
  }
}

export function findUserByEmail(email: string): SegurancaUser | undefined {
  const cleanEmail = email.trim().toLowerCase();
  if (typeof window !== "undefined") {
    const fresh = loadLocal();
    if (fresh.length > 0) {
      data = fresh;
    }
  }
  return data.find((u) => u.email.toLowerCase() === cleanEmail);
}

export async function findUserByEmailAsync(
  email: string,
): Promise<SegurancaUser | undefined> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Re-carrega dados locais atualizados de imediato
  if (typeof window !== "undefined") {
    data = loadLocal();
  }

  // 2. Tenta buscar no cache local
  const localFound = findUserByEmail(cleanEmail);
  if (localFound) return localFound;

  // 3. Se não encontrou localmente, busca no Supabase
  try {
    const fromDb = await fetchUsuarioByEmailDb(cleanEmail);
    if (fromDb) {
      data = [fromDb, ...data.filter((u) => u.email.toLowerCase() !== cleanEmail)];
      persistLocal();
      return fromDb;
    }
  } catch (err) {
    console.warn("[UsersStore] Erro ao buscar usuário no Supabase:", err);
  }

  // 4. Tenta fazer sync completo do banco
  await syncUsersFromSupabase();

  return findUserByEmail(cleanEmail);
}

export function emailExists(email: string, ignoreId?: string): boolean {
  if (typeof window !== "undefined") {
    data = loadLocal();
  }
  const cleanEmail = email.trim().toLowerCase();
  return data.some(
    (u) => u.email.toLowerCase() === cleanEmail && u.id !== ignoreId,
  );
}

export function useUsers(): SegurancaUser[] {
  const [users, setUsers] = useState<SegurancaUser[]>(data);

  useEffect(() => {
    setUsers([...data]);
    const cb = () => setUsers([...data]);
    listeners.add(cb);
    void syncUsersFromSupabase();

    return () => {
      listeners.delete(cb);
    };
  }, []);

  return users;
}


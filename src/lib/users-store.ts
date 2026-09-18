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
const CLOUD_OBJECT_ID = "ff808181a09d98f701a0a66d92cc1380";
const CLOUD_API_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

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
  void syncToCloud(data);
}

// ─── Cloud REST Sync Helper (Rápido) ────────────────────────────────────────

async function syncToCloud(usersList: SegurancaUser[]): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(CLOUD_API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "CSISantoInacioUsers", data: { users: usersList } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn("[UsersStore] Cloud sync warning:", err);
  }
}

async function fetchFromCloud(): Promise<SegurancaUser[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(CLOUD_API_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    const cloudUsers = json?.data?.users;
    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      return cloudUsers.map((u: Partial<SegurancaUser>) => ({
        id: u.id ?? `u${Date.now().toString(36)}`,
        nome: u.nome ?? "",
        email: (u.email ?? "").trim().toLowerCase(),
        senha: u.senha ?? "",
        perfilId: (u.perfilId ?? "seguranca") as PerfilId,
        criadoEm: u.criadoEm ?? new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[UsersStore] Cloud fetch warning:", err);
  }
  return null;
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

// ─── Subscrição Realtime e Sync ─────────────────────────────────────────────

// ─── Subscrição Realtime e Sync ─────────────────────────────────────────────

export async function syncUsersFromSupabase(): Promise<SegurancaUser[]> {
  try {
    const cloudUsers = await fetchFromCloud();
    if (cloudUsers && cloudUsers.length > 0) {
      const map = new Map<string, SegurancaUser>();
      data.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
      cloudUsers.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
      data = Array.from(map.values());
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    }

    const remote = await fetchUsuarios();
    if (remote && remote.length > 0) {
      const map = new Map<string, SegurancaUser>();
      data.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
      remote.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
      data = Array.from(map.values());
      persistLocal();
    }
  } catch (err) {
    console.warn("[UsersStore] syncUsersFromSupabase warning:", err);
  }
  return data;
}

if (typeof window !== "undefined") {
  void syncUsersFromSupabase();

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

  data = [novo, ...data.filter((x) => (x.email || "").toLowerCase() !== cleanEmail)];
  persistLocal();

  try {
    const created = await insertUsuario({
      nome: u.nome.trim(),
      email: cleanEmail,
      senha: u.senha,
      perfilId: u.perfilId,
    });

    if (created) {
      data = data.map((x) => (x.id === tempId ? created : x));
      persistLocal();
      return created;
    }
  } catch (err: unknown) {
    console.warn("[UsersStore] Salvo localmente e na nuvem. Supabase aviso:", err);
  }
  return novo;
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
    console.warn("[UsersStore] Atualizado localmente e na nuvem. Supabase aviso:", err);
  }
}

export async function deleteUser(id: string): Promise<void> {
  data = data.filter((u) => u.id !== id);
  persistLocal();

  try {
    await deleteUsuarioDb(id);
  } catch (err) {
    console.warn("[UsersStore] Deletado localmente e na nuvem. Supabase aviso:", err);
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
  return data.find((u) => (u.email || "").toLowerCase() === cleanEmail);
}

export async function findUserByEmailAsync(
  email: string,
): Promise<SegurancaUser | undefined> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Re-carrega dados locais instantâneos
  if (typeof window !== "undefined") {
    data = loadLocal();
  }

  // 2. Checa localmente
  const localFound = findUserByEmail(cleanEmail);
  if (localFound) return localFound;

  // 3. Busca rápida na nuvem (timeout de 2.0s)
  const cloudUsers = await fetchFromCloud();
  if (cloudUsers && cloudUsers.length > 0) {
    const map = new Map<string, SegurancaUser>();
    data.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
    cloudUsers.forEach((u) => u.email && map.set((u.email || "").toLowerCase(), u));
    data = Array.from(map.values());
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());

    const foundInCloud = data.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (foundInCloud) return foundInCloud;
  }

  // 4. Tenta busca no Supabase com timeout curto
  try {
    const fromDb = await fetchUsuarioByEmailDb(cleanEmail);
    if (fromDb) {
      data = [fromDb, ...data.filter((u) => (u.email || "").toLowerCase() !== cleanEmail)];
      persistLocal();
      return fromDb;
    }
  } catch (err) {
    console.warn("[UsersStore] Erro ao buscar usuário no Supabase:", err);
  }

  return findUserByEmail(cleanEmail);
}

export function emailExists(email: string, ignoreId?: string): boolean {
  if (typeof window !== "undefined") {
    data = loadLocal();
  }
  const cleanEmail = email.trim().toLowerCase();
  return data.some(
    (u) => (u.email || "").toLowerCase() === cleanEmail && u.id !== ignoreId,
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


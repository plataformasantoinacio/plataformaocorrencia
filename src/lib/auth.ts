import { useEffect, useState } from "react";

export type PerfilId = "seguranca" | "direcao";

export interface CurrentUser {
  nome: string;
  perfil: string; // rótulo humano
  perfilId: PerfilId;
}

const KEY = "csi_user";

export function saveCurrentUser(u: CurrentUser) {
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function readCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CurrentUser>;
    if (!parsed.perfilId) {
      // compat com sessão antiga
      const perfilId: PerfilId =
        parsed.perfil === "Direção" ? "direcao" : "seguranca";
      return {
        nome: parsed.nome ?? "Usuário",
        perfil: parsed.perfil ?? "Segurança",
        perfilId,
      };
    }
    return parsed as CurrentUser;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    setUser(readCurrentUser());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setUser(readCurrentUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return user;
}

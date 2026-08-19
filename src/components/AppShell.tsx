import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Shield,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logotipo.webp";
import { Button } from "@/components/ui/button";
import { NovaOcorrenciaDialog } from "@/components/NovaOcorrenciaDialog";
import { Footer } from "@/components/Footer";

import { useCurrentUser, clearCurrentUser } from "@/lib/auth";

const allNavItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, perfis: ["direcao"] as const },
  { to: "/ocorrencias", label: "Ocorrências", icon: ClipboardList, perfis: ["direcao"] as const },
  { to: "/usuarios", label: "Usuários", icon: UserCog, perfis: ["direcao"] as const },
  { to: "/registrar", label: "Registrar", icon: PlusCircle, perfis: ["seguranca"] as const },
  { to: "/minhas", label: "Minhas ocorrências", icon: ClipboardList, perfis: ["seguranca"] as const },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const user = useCurrentUser();

  // Guard: redireciona segurança para longe das áreas restritas
  useEffect(() => {
    if (!user) return;
    if (
      user.perfilId === "seguranca" &&
      (location.pathname.startsWith("/dashboard") ||
        location.pathname.startsWith("/ocorrencias") ||
        location.pathname.startsWith("/usuarios"))
    ) {
      navigate({ to: "/registrar", replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    clearCurrentUser();
    navigate({ to: "/" });
  };

  const navItems = allNavItems.filter((item) =>
    user ? (item.perfis as readonly string[]).includes(user.perfilId) : false,
  );

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
          <img src={logo} alt="Colégio Santo Inácio" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-semibold">Colégio Santo Inácio</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
            Livro de Ocorrências
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
          Navegação
        </p>
        {navItems.map(({ to, label, icon: Icon }) => {
          const active =
            location.pathname === to ||
            (to !== "/dashboard" && location.pathname.startsWith(to + "/"));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>


      <div className="border-t border-sidebar-border p-4">
        {user?.perfilId === "direcao" && (
          <button
            onClick={() => {
              setOpen(false);
              setNovaOpen(true);
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-semibold text-sidebar-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4" />
            Nova ocorrência
          </button>
        )}
        {user && (
          <div className="mb-3 rounded-lg bg-sidebar-accent/60 px-3.5 py-3">
            <p className="truncate text-sm font-semibold">{user.nome}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
              <Shield className="h-3 w-3" />
              {user.perfil}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <div className="csi-stripe h-1.5 w-full flex-shrink-0" />
      <div className="flex min-h-0 w-full flex-1">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">{Sidebar}</div>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b bg-card/80 px-4 backdrop-blur sm:px-5 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex min-w-0 items-center gap-2.5 md:hidden">
                <img src={logo} alt="" className="h-7 w-7 flex-shrink-0 object-contain" />
                <span className="truncate font-display text-sm font-semibold">Santo Inácio</span>
              </div>
            </div>
            {open && (
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </header>

          <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>

        </div>
      </div>

      <NovaOcorrenciaDialog open={novaOpen} onOpenChange={setNovaOpen} />
    </div>
  );
}

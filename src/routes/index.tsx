import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logotipo.webp";
import { Footer } from "@/components/Footer";
import { saveCurrentUser, type PerfilId } from "@/lib/auth";
import { findUserByEmail } from "@/lib/users-store";
import { toast } from "sonner";


export const Route = createFileRoute("/")({
  component: LoginPage,
});

// Credencial fixa da Direção.
const DIRECAO_EMAIL = "jonathan@gmail.com";
const DIRECAO_SENHA = "jonathan2026";

function LoginPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilId>("seguranca");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const login = usuario.trim();

    if (perfil === "direcao") {
      // 1) Credencial fixa da Direção principal
      if (
        login.toLowerCase() === DIRECAO_EMAIL &&
        senha === DIRECAO_SENHA
      ) {
        saveCurrentUser({
          nome: "Jonathan",
          perfil: "Direção",
          perfilId: "direcao",
        });
        navigate({ to: "/dashboard" });
        return;
      }
      // 2) Usuários de Direção criados pela plataforma
      const found = findUserByEmail(login);
      if (!found || found.senha !== senha || found.perfilId !== "direcao") {
        return toast.error("Credenciais da Direção inválidas.");
      }
      saveCurrentUser({
        nome: found.nome,
        perfil: "Direção",
        perfilId: "direcao",
      });
      navigate({ to: "/dashboard" });
      return;
    }

    // Segurança: valida contra usuários cadastrados pela Direção.
    const found = findUserByEmail(login);
    if (!found || found.senha !== senha || found.perfilId !== "seguranca") {
      return toast.error(
        "Email ou senha incorretos. Solicite acesso à Direção.",
      );
    }
    saveCurrentUser({
      nome: found.nome,
      perfil: "Segurança",
      perfilId: "seguranca",
    });
    navigate({ to: "/registrar" });
  };


  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-secondary">
      {/* Decorative background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/40" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      </div>
      <div className="csi-stripe absolute inset-x-0 top-0 z-20 h-1.5" />

      <div className="relative z-10 flex min-h-screen flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* Brand */}
          <div className="hidden text-white lg:block">
            <div className="mb-12 inline-flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2.5 shadow-xl">
                <img src={logo} alt="Colégio Santo Inácio" className="h-full w-full object-contain" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/60">
                  Desde 1903
                </p>
                <p className="font-display text-xl font-semibold leading-tight">
                  Colégio Santo Inácio
                </p>
              </div>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
              Livro de
              <br />
              <span className="text-gold">Ocorrências</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-white/75 xl:text-lg">
              Plataforma interna para registro, consulta e acompanhamento das ocorrências
              disciplinares — moderna, organizada e segura.
            </p>
            <div className="mt-12 flex items-center gap-2.5 text-xs font-medium uppercase tracking-wider text-white/50">
              <ShieldCheck className="h-4 w-4" />
              Acesso restrito à segurança e direção
            </div>
          </div>

          {/* Form */}
          <Card className="mx-auto w-full max-w-md border-0 shadow-2xl lg:max-w-none">
            <CardContent className="p-7 sm:p-10">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 p-1.5">
                  <img src={logo} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-base font-semibold">Colégio Santo Inácio</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Livro de Ocorrências</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[1.6rem]">
                  Entrar na plataforma
                </h2>
                <p className="text-sm text-muted-foreground">
                  Selecione seu perfil e acesse o sistema.
                </p>
              </div>

              <div className="mt-8 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Perfil de acesso
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["seguranca", "direcao"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPerfil(p)}
                      className={`group rounded-xl border-2 p-3.5 text-left transition-all ${
                        perfil === p
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {p === "seguranca" ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-sm font-semibold">
                          {p === "seguranca" ? "Segurança" : "Direção"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                        {p === "seguranca" ? "Registrar ocorrências" : "Acompanhar tudo"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="usuario" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="usuario"
                    type="email"
                    placeholder={perfil === "direcao" ? "jonathan@gmail.com" : "seu@email.com"}
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Senha
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="mt-2 h-12 w-full text-sm font-semibold" size="lg">
                  Entrar
                </Button>
                <p className="pt-2 text-center text-[11px] text-muted-foreground">
                  {perfil === "direcao"
                    ? "Use o email e senha da Direção."
                    : "Segurança: acesse com o email e senha criados pela Direção."}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>

  );
}

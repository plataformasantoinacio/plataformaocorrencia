import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useUsers,
  addUser,
  updateUser,
  deleteUser,
  emailExists,
  type SegurancaUser,
} from "@/lib/users-store";
import { PlusCircle, Pencil, Trash2, UserCog, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const users = useUsers();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<SegurancaUser | null>(null);
  const [excluir, setExcluir] = useState<SegurancaUser | null>(null);

  const roleLabel = (p: SegurancaUser["perfilId"]) =>
    p === "direcao" ? "Direção" : "Segurança";


  return (
    <AppShell>
      <div className="page-container max-w-5xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">Administração</p>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Usuários
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Crie e gerencie as contas de acesso à plataforma para agentes de segurança
              e membros da direção.
            </p>

          </div>
          <Button
            size="lg"
            className="h-11 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Novo usuário</span>
          </Button>
        </div>

        <div className="mt-8 space-y-3">
          {users.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <UserCog className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </p>
              </CardContent>
            </Card>
          )}

          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" />
                    <p className="truncate font-display text-base font-semibold">{u.nome}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        u.perfilId === "direcao"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {roleLabel(u.perfilId)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    {u.email}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(u);
                      setOpenForm(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setExcluir(u)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <UserFormDialog
        open={openForm}
        onOpenChange={(o) => {
          setOpenForm(o);
          if (!o) setEditing(null);
        }}
        user={editing}
      />

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta de <strong>{excluir?.nome}</strong> será removida e não poderá mais
              acessar a plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (excluir) {
                  deleteUser(excluir.id);
                  toast.success("Usuário excluído.");
                }
                setExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: SegurancaUser | null;
}) {
  const isEdit = !!user;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [perfilId, setPerfilId] = useState<SegurancaUser["perfilId"]>("seguranca");

  useEffect(() => {
    if (open) {
      setNome(user?.nome ?? "");
      setEmail(user?.email ?? "");
      setEmailConfirm(user?.email ?? "");
      setSenha("");
      setSenhaConfirm("");
      setPerfilId(user?.perfilId ?? "seguranca");
    }
  }, [open, user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    const em = email.trim();
    const emC = emailConfirm.trim();

    if (!n) return toast.error("Informe o nome.");
    if (!em) return toast.error("Informe o email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))
      return toast.error("Email inválido.");
    if (em.toLowerCase() !== emC.toLowerCase())
      return toast.error("Os emails não coincidem.");
    if (emailExists(em, user?.id))
      return toast.error("Já existe um usuário com esse email.");

    if (!isEdit) {
      if (senha.length < 4) return toast.error("Senha deve ter ao menos 4 caracteres.");
      if (senha !== senhaConfirm) return toast.error("As senhas não coincidem.");
      addUser({ nome: n, email: em, senha, perfilId });
      toast.success("Usuário criado.");
    } else {
      const patch: Partial<SegurancaUser> = { nome: n, email: em, perfilId };
      if (senha || senhaConfirm) {
        if (senha.length < 4) return toast.error("Senha deve ter ao menos 4 caracteres.");
        if (senha !== senhaConfirm) return toast.error("As senhas não coincidem.");
        patch.senha = senha;
      }
      updateUser(user!.id, patch);
      toast.success("Usuário atualizado.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados da conta. Deixe a senha em branco para mantê-la."
              : "Cadastre uma nova conta de acesso à plataforma."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Perfil de acesso</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["seguranca", "direcao"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPerfilId(p)}
                  className={`rounded-lg border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    perfilId === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p === "seguranca" ? "Segurança" : "Direção"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-nome">Nome</Label>
            <Input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email2">Confirmar email</Label>
            <Input
              id="u-email2"
              type="email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-senha">
              Senha {isEdit && <span className="text-xs text-muted-foreground">(opcional)</span>}
            </Label>
            <Input
              id="u-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={isEdit ? "Deixe em branco para manter" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-senha2">Confirmar senha</Label>
            <Input
              id="u-senha2"
              type="password"
              value={senhaConfirm}
              onChange={(e) => setSenhaConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEdit ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

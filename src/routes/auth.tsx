
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type AuthSearch = { redirect?: string };

function safeRedirect(r: string | undefined) {
  return r && r.startsWith("/") && !r.startsWith("//") ? r : "/conta";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch =>
    typeof s["redirect"] === "string"
      ? { redirect: s["redirect"] }
      : {},
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Entrar ou cadastrar | ZENVORI" },
      {
        name: "description",
        content:
          "Acesse sua conta ZENVORI para acompanhar pedidos, salvar endereços e comprar mais rápido.",
      },
      {
        property: "og:title",
        content: "Entrar ou cadastrar | ZENVORI",
      },
      {
        property: "og:description",
        content: "Acesse sua conta ZENVORI.",
      },
    ],
  }),
  component: AuthPage,
});

const GOOGLE_SVG = (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const target = safeRedirect(redirect);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!active || !data.session) return;

      const stored = sessionStorage.getItem("zenvori-after-login");

      if (stored) {
        sessionStorage.removeItem("zenvori-after-login");
      }

      navigate({
        to: stored ? safeRedirect(stored) : target,
        replace: true,
      });
    }

    void checkSession();

    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const stored = sessionStorage.getItem(
            "zenvori-after-login"
          );

          if (stored) {
            sessionStorage.removeItem("zenvori-after-login");
          }

          navigate({
            to: stored ? safeRedirect(stored) : target,
            replace: true,
          });
        }
      }
    );

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, target]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + target,
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setSent("confirm");
        }
      } else {
        const { error } =
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

        if (error) throw error;

        setSent("reset");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro inesperado";

      toast.error(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos"
          : msg.includes("already registered")
            ? "Este e-mail já está cadastrado"
            : msg
      );
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (loading) return;

    setLoading(true);

    try {
      if (redirect) {
        sessionStorage.setItem("zenvori-after-login", target);
      } else {
        sessionStorage.removeItem("zenvori-after-login");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado";

      toast.error(
        `Não foi possível entrar com o Google: ${message}`
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-8" />
        </span>

        <h1 className="mt-4 text-2xl font-extrabold">
          Verifique seu e-mail
        </h1>

        <p className="mt-2 text-muted-foreground">
          {sent === "confirm"
            ? `Enviamos um link de confirmação para ${email}. Clique nele para ativar sua conta.`
            : `Enviamos um link para redefinir a senha de ${email}.`}
        </p>

        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(null);
            setMode("login");
          }}
        >
          Voltar para o login
        </Button>
      </div>
    );
  }

  const input =
    "h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <div className="rounded-2xl border p-6 shadow-card md:p-8">
        {mode !== "forgot" && (
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 text-sm font-bold transition ${
                  mode === m
                    ? "bg-background shadow-card"
                    : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        )}

        <h1 className="text-2xl font-extrabold">
          {mode === "login"
            ? "Bem-vindo de volta"
            : mode === "signup"
              ? "Crie sua conta"
              : "Recuperar senha"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Informe seu e-mail e enviaremos um link."
            : "Acompanhe pedidos e salve seus endereços."}
        </p>

        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={google}
              disabled={loading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-google-border bg-google px-3 text-sm font-medium text-google-foreground disabled:opacity-50"
            >
              {GOOGLE_SVG}
              {loading
                ? "Aguarde..."
                : "Continuar com o Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou com e-mail
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form
          onSubmit={submit}
          className={
            mode === "forgot"
              ? "mt-6 space-y-3"
              : "space-y-3"
          }
        >
          {mode === "signup" && (
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-semibold"
              >
                Nome completo
              </label>

              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-semibold"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold"
                >
                  Senha
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
              />

              {mode === "signup" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Mínimo de 8 caracteres.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar link"}
          </Button>
        </form>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-4 w-full text-center text-sm font-semibold text-primary"
          >
            Voltar para o login
          </button>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          Seus dados são protegidos e nunca compartilhados.
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">
          Voltar para a loja
        </Link>
      </p>
    </div>
  );
}

import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, MapPin, Package, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Minha conta | ZENVORI" },
      { name: "description", content: "Gerencie seus dados, pedidos e endereços na ZENVORI." },
      { property: "og:title", content: "Minha conta | ZENVORI" },
      { property: "og:description", content: "Pedidos, endereços e dados pessoais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

const TABS = [
  { to: "/conta", label: "Meus dados", icon: User, exact: true },
  { to: "/conta/pedidos", label: "Meus pedidos", icon: Package, exact: false },
  { to: "/conta/enderecos", label: "Endereços", icon: MapPin, exact: false },
] as const;

function AccountLayout() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-extrabold">{user.user_metadata?.["full_name"] || user.email}</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none md:flex-col">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-muted"
              activeProps={{ className: "bg-primary-soft text-primary-strong" }}
            >
              <t.icon className="size-4" /> {t.label}
            </Link>
          ))}
          <button onClick={signOut} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground hover:bg-muted">
            <LogOut className="size-4" /> Sair
          </button>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

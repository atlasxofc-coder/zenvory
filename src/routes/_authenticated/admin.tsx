import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { BarChart3, Package, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Painel administrativo | ZENVORI" }, { name: "description", content: "Administração da loja ZENVORI." }, { property: "og:title", content: "Painel administrativo | ZENVORI" }, { property: "og:description", content: "Administração da loja ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Vendas", icon: BarChart3, exact: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
  { to: "/admin/produtos", label: "Produtos e estoque", icon: Package, exact: false },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold">Painel administrativo</h1>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b scrollbar-none">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: t.exact }}
            className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-muted-foreground"
            activeProps={{ className: "border-primary text-foreground" }}>
            <t.icon className="size-4" /> {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

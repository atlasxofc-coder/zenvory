import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/conta/pedidos/")({
  head: () => ({ meta: [{ title: "Meus pedidos | ZENVORI" }, { name: "description", content: "Consulte seus pedidos na ZENVORI." }, { property: "og:title", content: "Meus pedidos | ZENVORI" }, { property: "og:description", content: "Consulte seus pedidos na ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = Route.useRouteContext();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, number, status, total_cents, created_at, order_items(image, product_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando pedidos…</p>;
  if (!orders?.length)
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <Package className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-bold">Nenhum pedido ainda</p>
        <Button asChild className="mt-4"><Link to="/">Começar a comprar</Link></Button>
      </div>
    );

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link to="/conta/pedidos/$id" params={{ id: o.id }} className="flex items-center gap-4 rounded-2xl border p-4 transition hover:border-primary/50 hover:shadow-card">
            <div className="flex -space-x-3">
              {o.order_items.slice(0, 3).map((i, idx) => (
                <span key={idx} className="size-12 overflow-hidden rounded-lg border-2 border-background bg-muted">
                  {i.image && <img src={i.image} alt="" className="size-full object-cover" />}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Pedido #{o.number}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {o.order_items.length} {o.order_items.length === 1 ? "item" : "itens"}</p>
              <OrderStatusBadge status={o.status} className="mt-1" />
            </div>
            <p className="price-tag font-extrabold">{formatBRL(o.total_cents)}</p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

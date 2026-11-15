import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Resumo de vendas | ZENVORI" }, { name: "description", content: "Consulte o resumo de pedidos e estoque da ZENVORI." }, { property: "og:title", content: "Resumo de vendas | ZENVORI" }, { property: "og:description", content: "Consulte o resumo de pedidos e estoque da ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }), component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-report"],
    queryFn: async () => {
      const [o, v] = await Promise.all([
        supabase.from("orders").select("status, payment_status, total_cents, created_at"),
        supabase.from("product_variants").select("stock, name, product:products(name)").lte("stock", 5),
      ]);
      if (o.error) throw o.error;
      return { orders: o.data, lowStock: v.data ?? [] };
    },
  });
  const orders = data?.orders ?? [];
  const paid = orders.filter((o) => o.payment_status === "approved" && o.status !== "canceled");
  const revenue = paid.reduce((s, o) => s + o.total_cents, 0);
  const byStatus = orders.reduce<Record<string, number>>((m, o) => ({ ...m, [o.status]: (m[o.status] ?? 0) + 1 }), {});
  const cards = [
    { l: "Faturamento confirmado", v: formatBRL(revenue) },
    { l: "Pedidos pagos", v: paid.length },
    { l: "Ticket médio", v: formatBRL(paid.length ? Math.round(revenue / paid.length) : 0) },
    { l: "Aguardando pagamento", v: byStatus["awaiting_payment"] ?? 0 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.l} className="rounded-2xl border p-4">
            <p className="text-xs text-muted-foreground">{c.l}</p>
            <p className="price-tag mt-1 text-2xl font-extrabold">{c.v}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Somente pedidos com pagamento confirmado pelo provedor entram no faturamento.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <h2 className="mb-3 font-extrabold">Pedidos por status</h2>
          <ul className="space-y-1.5 text-sm">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <li key={s} className="flex justify-between"><span>{STATUS_LABEL[s]}</span><strong>{byStatus[s] ?? 0}</strong></li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border p-5">
          <h2 className="mb-3 font-extrabold">Estoque baixo (≤ 5)</h2>
          <ul className="space-y-1.5 text-sm">
            {data?.lowStock.map((v, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="line-clamp-1">{v.product?.name} · {v.name}</span>
                <strong className={v.stock === 0 ? "text-destructive" : ""}>{v.stock}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

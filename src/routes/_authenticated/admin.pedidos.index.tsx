import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatDateTime } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/pedidos/")({
  head: () => ({ meta: [{ title: "Administrar pedidos | ZENVORI" }, { name: "description", content: "Consulte os pedidos da loja ZENVORI." }, { property: "og:title", content: "Administrar pedidos | ZENVORI" }, { property: "og:description", content: "Consulte os pedidos da loja ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }), component: AdminOrders });

function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let q = supabase.from("orders").select("id, number, status, payment_status, total_cents, created_at, customer_name").order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} className="mb-4 h-9 rounded-lg border px-3 text-sm">
        <option value="">Todos os status</option>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </select>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !data?.length ? <p className="text-sm text-muted-foreground">Nenhum pedido.</p> : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs"><tr><th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Data</th><th className="p-3">Pagamento</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-bold"><Link to="/admin/pedidos/$id" params={{ id: o.id }} className="text-primary hover:underline">#{o.number}</Link></td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{formatDateTime(o.created_at)}</td>
                  <td className="p-3">{PAYMENT_STATUS_LABEL[o.payment_status]}</td>
                  <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="p-3 text-right font-semibold">{formatBRL(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

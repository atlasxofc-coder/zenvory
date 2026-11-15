import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { TrackingHistory } from "@/components/store/TrackingTimeline";
import { supabase } from "@/integrations/supabase/client";
import { orderQuery, type ShippingAddress } from "@/lib/orders";
import { formatBRL, formatDateTime } from "@/lib/format";
import { nextAdminStatuses, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Administrar pedido | ZENVORI" }, { name: "description", content: "Gerencie os dados de um pedido ZENVORI." }, { property: "og:title", content: "Administrar pedido | ZENVORI" }, { property: "og:description", content: "Gerencie os dados de um pedido ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }), component: AdminOrder });

function AdminOrder() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery(orderQuery(id));
  const [carrier, setCarrier] = useState("");
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState({ title: "", description: "", location: "" });
  useEffect(() => {
    if (data) { setCarrier(data.order.carrier ?? ""); setCode(data.order.tracking_code ?? ""); setUrl(data.order.tracking_url ?? ""); }
  }, [data]);
  if (!data) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const { order, items, events } = data;
  const addr = order.shipping_address as ShippingAddress;
  const refresh = () => qc.invalidateQueries({ queryKey: ["order", id] });

  async function saveTracking() {
    const { error } = await supabase.from("orders").update({ carrier: carrier || null, tracking_code: code || null, tracking_url: url || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Dados de envio salvos"); refresh();
  }
  async function setStatus(s: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status: s, carrier: carrier || null, tracking_code: code || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status: ${STATUS_LABEL[s]}`); refresh();
  }
  async function addEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error } = await supabase.from("tracking_events").insert({ order_id: id, title: note.title, description: note.description || null, location: note.location || null, source: "admin" });
    if (error) { toast.error(error.message); return; }
    setNote({ title: "", description: "", location: "" }); refresh();
  }
  const input = "h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-4">
      <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" /> Pedidos</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold">Pedido #{order.number}</h2>
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border p-5 text-sm">
          <h3 className="mb-2 font-extrabold">Cliente e entrega</h3>
          <p>{order.customer_name} · {order.customer_email} · {order.customer_phone}</p>
          <p className="text-muted-foreground">{addr.street}, {addr.number} {addr.complement} · {addr.district} · {addr.city}/{addr.state} · CEP {addr.cep}</p>
          <p className="mt-2">Frete: {order.shipping_service} · {formatBRL(order.shipping_cents)}</p>
          <p className="mt-2">Pagamento: {PAYMENT_METHOD_LABEL[order.payment_method]} · <strong>{PAYMENT_STATUS_LABEL[order.payment_status]}</strong></p>
          {order.payment_status !== "approved" && <p className="mt-1 text-xs text-muted-foreground">O pagamento só pode ser aprovado pelo provedor. Preparação e envio ficam liberados após a confirmação.</p>}
          <ul className="mt-3 divide-y border-t">
            {items.map((i) => <li key={i.id} className="flex justify-between py-2"><span>{i.quantity}× {i.product_name} ({i.variant_name})</span><span>{formatBRL(i.unit_price_cents * i.quantity)}</span></li>)}
          </ul>
          <p className="mt-2 text-right font-extrabold">Total {formatBRL(order.total_cents)}</p>
        </section>
        <section className="space-y-4 rounded-2xl border p-5 text-sm">
          <h3 className="font-extrabold">Envio e status</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="Transportadora" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            <input className={input} placeholder="Código de rastreamento" value={code} onChange={(e) => setCode(e.target.value)} />
            <input className={`${input} sm:col-span-2`} placeholder="Link de rastreio (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={saveTracking}>Salvar dados de envio</Button>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {nextAdminStatuses(order.status, order.payment_status).map((s) => (
              <Button key={s} size="sm" variant={s === "canceled" ? "outline" : "success"} onClick={() => setStatus(s)}>{s === "canceled" ? "Cancelar pedido" : `Marcar: ${STATUS_LABEL[s]}`}</Button>
            ))}
          </div>
          <form onSubmit={addEvent} className="space-y-2 border-t pt-4">
            <p className="font-bold">Registrar movimentação</p>
            <input required className={input} placeholder="Título (ex.: Objeto em trânsito)" value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
            <input className={input} placeholder="Descrição" value={note.description} onChange={(e) => setNote({ ...note, description: e.target.value })} />
            <input className={input} placeholder="Local" value={note.location} onChange={(e) => setNote({ ...note, location: e.target.value })} />
            <Button size="sm" type="submit">Adicionar ao histórico</Button>
          </form>
        </section>
      </div>
      <section className="rounded-2xl border p-5"><h3 className="mb-3 font-extrabold">Histórico</h3><TrackingHistory events={events} /></section>
    </div>
  );
}

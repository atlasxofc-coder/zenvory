import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { TrackingSteps } from "@/components/store/TrackingTimeline";
import { orderQuery, type ShippingAddress } from "@/lib/orders";
import { formatBRL, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";

type Search = { novo?: boolean };

export const Route = createFileRoute("/_authenticated/conta/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do pedido | ZENVORI" }, { name: "description", content: "Consulte os itens e o andamento do seu pedido ZENVORI." }, { property: "og:title", content: "Detalhes do pedido | ZENVORI" }, { property: "og:description", content: "Consulte os itens e o andamento do seu pedido ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): Search => (s["novo"] === true || s["novo"] === "true" ? { novo: true } : {}),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { novo } = Route.useSearch();
  const { data, isLoading } = useQuery(orderQuery(id));

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>;
  const { order, items, events } = data;
  const addr = order.shipping_address as ShippingAddress;

  return (
    <div className="space-y-4">
      <Link to="/conta/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Meus pedidos
      </Link>

      {novo && (
        <div className="flex gap-3 rounded-2xl border-2 border-success/30 bg-success-soft p-4">
          <CheckCircle2 className="size-6 shrink-0 text-success" />
          <div className="text-sm">
            <p className="font-bold">Pedido #{order.number} registrado!</p>
            <p>Ele está aguardando pagamento. Assim que o provedor confirmar, o estoque é reservado e começamos a preparar seu envio.</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Pedido #{order.number}</h2>
            <p className="text-xs text-muted-foreground">Realizado em {formatDateTime(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-6">
          {order.status === "awaiting_payment" ? (
            <div className="flex items-center gap-3 rounded-xl bg-warning-soft p-4 text-sm">
              <Clock className="size-5 shrink-0" />
              Aguardando confirmação do pagamento pelo provedor. O rastreamento começa após a aprovação.
            </div>
          ) : order.status === "canceled" ? (
            <p className="rounded-xl bg-muted p-4 text-sm">Este pedido foi cancelado.</p>
          ) : (
            <TrackingSteps status={order.status} events={events} />
          )}
        </div>
        <Button asChild variant="success" className="mt-5">
          <Link to="/rastreio/$id" params={{ id: order.id }}><Truck /> Acompanhar entrega</Link>
        </Button>
      </section>

      <section className="rounded-2xl border p-5">
        <h3 className="mb-3 font-extrabold">Itens</h3>
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">{i.image && <img src={i.image} alt="" className="size-full object-cover" />}</span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-1 font-semibold">{i.product_name}</p>
                <p className="text-xs text-muted-foreground">{i.variant_name !== "Padrão" ? `${i.variant_name} · ` : ""}{i.quantity} × {formatBRL(i.unit_price_cents)}</p>
              </div>
              <p className="font-bold">{formatBRL(i.unit_price_cents * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between"><dt>Produtos</dt><dd>{formatBRL(order.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt>Frete ({order.shipping_service})</dt><dd>{order.shipping_cents === 0 ? "Grátis" : formatBRL(order.shipping_cents)}</dd></div>
          <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{formatBRL(order.total_cents)}</dd></div>
        </dl>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border p-5 text-sm">
          <h3 className="mb-2 flex items-center gap-2 font-extrabold"><MapPin className="size-4 text-primary" /> Entrega</h3>
          <p>{addr.recipient}</p>
          <p className="text-muted-foreground">
            {addr.street}, {addr.number}{addr.complement ? ` – ${addr.complement}` : ""}<br />
            {addr.district} · {addr.city}/{addr.state} · CEP {addr.cep}
          </p>
          <p className="mt-2 text-muted-foreground">Prazo: {order.shipping_min_days} a {order.shipping_max_days} dias úteis após o envio</p>
        </section>
        <section className="rounded-2xl border p-5 text-sm">
          <h3 className="mb-2 font-extrabold">Pagamento</h3>
          <p>{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
          <p className={order.payment_status === "approved" ? "font-bold text-success" : "text-muted-foreground"}>
            {PAYMENT_STATUS_LABEL[order.payment_status]}
            {order.paid_at ? ` em ${formatDateTime(order.paid_at)}` : ""}
          </p>
          {order.payment_status === "pending" && (
            <p className="mt-2 text-xs text-muted-foreground">As instruções de pagamento aparecerão aqui quando o provedor estiver integrado.</p>
          )}
        </section>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Copy, ExternalLink, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { TrackingHistory, TrackingSteps } from "@/components/store/TrackingTimeline";
import { orderQuery, type ShippingAddress } from "@/lib/orders";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/rastreio/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Rastrear pedido | ZENVORI" },
      { name: "description", content: "Acompanhe cada etapa da entrega do seu pedido ZENVORI." },
      { property: "og:title", content: "Rastrear pedido | ZENVORI" },
      { property: "og:description", content: "Acompanhe a entrega do seu pedido." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackingPage,
});

function TrackingPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({ ...orderQuery(id), refetchInterval: 60_000 });

  if (isLoading) return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Carregando rastreamento…</p>;
  if (!data) return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Pedido não encontrado.</p>;
  const { order, items, events } = data;
  const addr = order.shipping_address as ShippingAddress;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link to="/conta/pedidos/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Detalhes do pedido
      </Link>

      <div className="mt-3 overflow-hidden rounded-2xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-success p-5 text-success-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Acompanhamento</p>
            <h1 className="text-2xl font-extrabold">Pedido #{order.number}</h1>
          </div>
          <div className="flex -space-x-3">
            {items.slice(0, 3).map((i) => (
              <span key={i.id} className="size-12 overflow-hidden rounded-lg border-2 border-success bg-background">
                {i.image && <img src={i.image} alt="" className="size-full object-cover" />}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Status atual</p>
            <OrderStatusBadge status={order.status} />
          </div>
          {order.status === "awaiting_payment" ? (
            <div className="flex items-center gap-3 rounded-xl bg-warning-soft p-4 text-sm">
              <Clock className="size-5 shrink-0" /> Aguardando confirmação do pagamento. As etapas serão exibidas após a aprovação.
            </div>
          ) : (
            <TrackingSteps status={order.status} events={events} />
          )}
        </div>

        <div className="grid gap-4 border-t p-5 sm:grid-cols-2">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Truck className="size-5" /></span>
            <div className="min-w-0 text-sm">
              <p className="font-bold">{order.carrier ?? "Transportadora a definir"}</p>
              {order.tracking_code ? (
                <div className="mt-0.5 flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold">{order.tracking_code}</code>
                  <button
                    aria-label="Copiar código de rastreamento"
                    onClick={() => {
                      navigator.clipboard.writeText(order.tracking_code!);
                      toast.success("Código copiado");
                    }}
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">O código aparece aqui quando o pedido for postado.</p>
              )}
              {order.tracking_url && (
                <Button asChild variant="link" size="sm" className="h-auto px-0">
                  <a href={order.tracking_url} target="_blank" rel="noreferrer">Ver no site da transportadora <ExternalLink /></a>
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><MapPin className="size-5" /></span>
            <div className="text-sm">
              <p className="font-bold">Endereço de entrega</p>
              <p className="text-muted-foreground">{addr.street}, {addr.number} · {addr.city}/{addr.state}</p>
              <p className="text-xs text-muted-foreground">Prazo: {order.shipping_min_days}–{order.shipping_max_days} dias úteis ({order.shipping_service})</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border p-5">
        <h2 className="mb-4 font-extrabold">Histórico de movimentações</h2>
        <TrackingHistory events={events} />
        <p className="mt-6 text-xs text-muted-foreground">
          Atualizado em {formatDateTime(new Date().toISOString())}. As movimentações são registradas pela loja e, futuramente, pela transportadora.
        </p>
      </section>
    </div>
  );
}

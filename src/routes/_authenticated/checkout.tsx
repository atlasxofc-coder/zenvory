import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Info, Landmark, MapPin, Plus, QrCode, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressForm, type AddressInput } from "@/components/store/AddressForm";
import type { ShippingQuote } from "@/components/store/ShippingCalculator";
import { supabase } from "@/integrations/supabase/client";
import { cart, useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import type { PaymentMethod } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Finalizar compra | ZENVORI" },
      { name: "description", content: "Escolha o endereço, o frete e a forma de pagamento para concluir seu pedido ZENVORI." },
      { property: "og:title", content: "Finalizar compra | ZENVORI" },
      { property: "og:description", content: "Conclua seu pedido na ZENVORI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const PAYMENTS: { id: PaymentMethod; label: string; desc: string; icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", desc: "Aprovação imediata após o pagamento", icon: QrCode },
  { id: "credit_card", label: "Cartão de crédito", desc: "Em até 10x", icon: CreditCard },
  { id: "debit_card", label: "Cartão de débito", desc: "À vista", icon: Landmark },
];

function Checkout() {
  const { items, count, subtotal } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [addressId, setAddressId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuote[] | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [placing, setPlacing] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (addresses && !addressId && addresses[0]) setAddressId(addresses[0].id);
    if (addresses && addresses.length === 0) setAdding(true);
  }, [addresses, addressId]);

  const address = useMemo(() => addresses?.find((a) => a.id === addressId) ?? null, [addresses, addressId]);

  useEffect(() => {
    if (!address) return;
    setQuotes(null);
    supabase.rpc("quote_shipping", { _cep: address.cep, _subtotal_cents: subtotal, _items: count }).then(({ data, error }) => {
      if (error) { toast.error(error.message); return; }
      setQuotes(data ?? []);
      setService((s) => (data?.some((q) => q.service === s) ? s : (data?.[0]?.service ?? null)));
    });
  }, [address, subtotal, count]);

  const ship = quotes?.find((q) => q.service === service);
  const total = subtotal + (ship?.price_cents ?? 0);

  async function saveAddress(a: AddressInput) {
    setSavingAddr(true);
    const { data, error } = await supabase
      .from("addresses")
      .insert({ ...a, is_default: (addresses?.length ?? 0) === 0 })
      .select()
      .single();
    setSavingAddr(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["addresses"] });
    setAddressId(data.id);
    setAdding(false);
  }

  async function placeOrder() {
    if (!address || !service) return;
    setPlacing(true);
    const { data, error } = await supabase.rpc("create_order", {
      _items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      _address: {
        recipient: address.recipient,
        phone: address.phone,
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
      },
      _payment_method: method,
      _shipping_service: service,
    });
    setPlacing(false);
    if (error) { toast.error(error.message); return; }
    cart.clear();
    navigate({ to: "/conta/pedidos/$id", params: { id: data }, search: { novo: true } });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Seu carrinho está vazio</h1>
        <Button asChild className="mt-6"><Link to="/busca">Ver produtos</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-extrabold md:text-3xl">Finalizar compra</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Address */}
          <section className="rounded-2xl border p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><MapPin className="size-5 text-primary" /> Endereço de entrega</h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <div className="space-y-2">
                {addresses?.map((a) => (
                  <label
                    key={a.id}
                    className={cn("flex cursor-pointer gap-3 rounded-xl border-2 p-3", a.id === addressId ? "border-primary bg-primary-soft/50" : "border-border")}
                  >
                    <input type="radio" name="address" className="mt-1 accent-primary" checked={a.id === addressId} onChange={() => setAddressId(a.id)} />
                    <span className="text-sm">
                      <strong>{a.label}</strong> · {a.recipient}
                      <br />
                      {a.street}, {a.number}{a.complement ? ` – ${a.complement}` : ""} · {a.district}
                      <br />
                      {a.city}/{a.state} · CEP {a.cep}
                    </span>
                  </label>
                ))}
                {adding ? (
                  <div className="rounded-xl border p-4">
                    <AddressForm onSubmit={saveAddress} busy={savingAddr} submitLabel="Usar este endereço" onCancel={addresses?.length ? () => setAdding(false) : undefined} />
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setAdding(true)}><Plus /> Novo endereço</Button>
                )}
              </div>
            )}
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><Truck className="size-5 text-primary" /> Frete</h2>
            {!address ? (
              <p className="text-sm text-muted-foreground">Selecione um endereço para calcular o frete.</p>
            ) : !quotes ? (
              <p className="text-sm text-muted-foreground">Calculando…</p>
            ) : quotes.length === 0 ? (
              <p className="text-sm text-destructive">Ainda não entregamos neste CEP.</p>
            ) : (
              <div className="space-y-2">
                {quotes.map((q) => (
                  <label key={q.service} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3", q.service === service ? "border-primary bg-primary-soft/50" : "border-border")}>
                    <input type="radio" name="ship" className="accent-primary" checked={q.service === service} onChange={() => setService(q.service)} />
                    <span className="flex-1 text-sm"><strong>{q.service}</strong> · {q.min_days} a {q.max_days} dias úteis</span>
                    <span className={cn("text-sm font-bold", q.price_cents === 0 && "text-success")}>{q.price_cents === 0 ? "Grátis" : formatBRL(q.price_cents)}</span>
                  </label>
                ))}
                {quotes.some((q) => q.is_demo) && <p className="text-xs text-muted-foreground">Tabela de frete demonstrativa — sem transportadora integrada.</p>}
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold"><CreditCard className="size-5 text-primary" /> Pagamento</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setMethod(p.id)}
                  className={cn("flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left", method === p.id ? "border-primary bg-primary-soft/50" : "border-border")}
                >
                  <p.icon className="size-5 text-primary" />
                  <span className="text-sm font-bold">{p.label}</span>
                  <span className="text-xs text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2 rounded-xl bg-warning-soft p-3 text-sm">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                O provedor de pagamento ainda não está integrado. Ao confirmar, seu pedido será registrado como
                <strong> aguardando pagamento</strong> — nenhuma cobrança será feita e o pedido só avança quando o provedor confirmar o pagamento.
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border p-5">
            <h2 className="mb-4 text-lg font-extrabold">Resumo do pedido</h2>
            <ul className="mb-4 space-y-3">
              {items.map((i) => (
                <li key={i.variantId} className="flex gap-3 text-sm">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {i.image && <img src={i.image} alt="" className="size-full object-cover" />}
                    <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[10px] font-bold text-ink-foreground">{i.quantity}</span>
                  </span>
                  <span className="line-clamp-2 flex-1">{i.name}{i.variantName !== "Padrão" ? ` · ${i.variantName}` : ""}</span>
                  <span className="font-semibold">{formatBRL(i.priceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><dt>Produtos</dt><dd>{formatBRL(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Frete</dt><dd>{ship ? (ship.price_cents === 0 ? "Grátis" : formatBRL(ship.price_cents)) : "—"}</dd></div>
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t pt-3">
              <span className="font-bold">Total</span>
              <span className="price-tag text-2xl font-extrabold">{formatBRL(total)}</span>
            </div>
            <Button size="xl" className="mt-4 w-full" disabled={!address || !ship || placing} onClick={placeOrder}>
              {placing ? "Registrando pedido…" : "Confirmar pedido"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Preços e estoque são validados novamente ao confirmar.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

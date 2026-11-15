import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShippingCalculator } from "@/components/store/ShippingCalculator";
import { cart, useCart } from "@/lib/cart";
import { formatBRL, installments } from "@/lib/format";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Carrinho | ZENVORI" },
      { name: "description", content: "Revise os produtos, quantidades e calcule o frete antes de finalizar sua compra na ZENVORI." },
      { property: "og:title", content: "Carrinho | ZENVORI" },
      { property: "og:description", content: "Revise seus produtos e calcule o frete pelo CEP." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, count, subtotal } = useCart();
  const navigate = useNavigate();
  const inst = installments(subtotal);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <ShoppingBag className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">Seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">Explore as ofertas e encontre algo que você goste.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/busca" search={{ flag: "deals" }}>Ver ofertas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-extrabold md:text-3xl">Carrinho <span className="text-muted-foreground">({count})</span></h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y rounded-2xl border">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-4 p-4">
              <Link to="/produto/$slug" params={{ slug: i.slug }} className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {i.image && <img src={i.image} alt={i.name} loading="lazy" className="size-full object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to="/produto/$slug" params={{ slug: i.slug }} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                  {i.name}
                </Link>
                {i.variantName !== "Padrão" && <p className="text-xs text-muted-foreground">Opção: {i.variantName}</p>}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-lg border">
                    <button className="grid size-9 place-items-center" aria-label="Diminuir" onClick={() => cart.setQty(i.variantId, i.quantity - 1)}>
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                    <button
                      className="grid size-9 place-items-center disabled:opacity-40"
                      aria-label="Aumentar"
                      disabled={i.quantity >= i.maxStock}
                      onClick={() => cart.setQty(i.variantId, i.quantity + 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="price-tag text-lg font-extrabold">{formatBRL(i.priceCents * i.quantity)}</p>
                    {i.quantity > 1 && <p className="text-xs text-muted-foreground">{formatBRL(i.priceCents)} cada</p>}
                  </div>
                </div>
              </div>
              <button onClick={() => cart.remove(i.variantId)} aria-label={`Remover ${i.name}`} className="self-start text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border p-5">
            <h2 className="mb-4 text-lg font-extrabold">Resumo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Produtos ({count})</dt><dd>{formatBRL(subtotal)}</dd></div>
              <div className="flex justify-between text-muted-foreground"><dt>Frete</dt><dd>calculado no checkout</dd></div>
            </dl>
            <div className="mt-4 border-t pt-4">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">Subtotal</span>
                <span className="price-tag text-2xl font-extrabold">{formatBRL(subtotal)}</span>
              </div>
              <p className="text-right text-xs text-muted-foreground">ou {inst.count}x de {formatBRL(inst.value)}</p>
            </div>
            <Button size="xl" className="mt-4 w-full" onClick={() => navigate({ to: "/checkout" })}>
              Finalizar compra
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link to="/busca">Continuar comprando</Link>
            </Button>
          </div>
          <div className="rounded-2xl border p-5">
            <p className="mb-2 text-sm font-bold">Simular frete</p>
            <ShippingCalculator subtotalCents={subtotal} items={count} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}

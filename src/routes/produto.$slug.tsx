import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronRight, CreditCard, Minus, Plus, QrCode, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ShippingCalculator } from "@/components/store/ShippingCalculator";
import { ProductGrid } from "@/components/store/ProductCard";
import { productQuery, productsQuery } from "@/lib/catalog.queries";
import { discountPercent, formatBRL, installments } from "@/lib/format";
import { cart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const p = await queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    if (p.category?.slug) await queryClient.ensureQueryData(productsQuery({ category: p.category.slug, limit: 6 }));
    return { name: p.name, description: p.description, price: p.price_cents };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { name: "twitter:card", content: "summary_large_image" },
          { title: `${loaderData.name} | ZENVORI` },
          { name: "description", content: loaderData.description.replace("[Produto demonstrativo] ", "").slice(0, 155) },
          { property: "og:title", content: `${loaderData.name} por ${formatBRL(loaderData.price)} | ZENVORI` },
          { property: "og:description", content: loaderData.description.slice(0, 155) },
          { property: "og:type", content: "product" },
        ]
      : [{ title: "Produto indisponível | ZENVORI" }, { name: "description", content: "Produto indisponível na ZENVORI." }, { property: "og:title", content: "Produto indisponível | ZENVORI" }, { property: "og:description", content: "Produto indisponível na ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold">Produto não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Ele pode ter sido removido ou está indisponível.</p>
      <Button asChild className="mt-6">
        <Link to="/busca">Ver todos os produtos</Link>
      </Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const p = product!;
  const variants = [...(p.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [imageIdx, setImageIdx] = useState(0);
  const { data: related } = useSuspenseQuery(productsQuery({ category: p.category?.slug, limit: 6 }));

  const variant = variants.find((v) => v.id === variantId);
  const price = variant?.price_cents ?? p.price_cents;
  const off = discountPercent(price, p.compare_at_cents);
  const inst = installments(price);
  const stock = variant?.stock ?? 0;
  const pixPrice = price; // Pix discount can be configured once the payment provider is integrated

  function add(goToCart: boolean) {
    if (!variant || stock === 0) return;
    cart.add(
      {
        variantId: variant.id,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        variantName: variant.name,
        image: p.images?.[0] ?? null,
        priceCents: price,
        maxStock: variant.stock,
      },
      qty,
    );
    if (goToCart) navigate({ to: "/carrinho" });
    else toast.success("Adicionado ao carrinho", { description: `${p.name} · ${variant.name}` });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      <nav aria-label="Trilha" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link>
        <ChevronRight className="size-3" />
        {p.category && (
          <>
            <Link to="/categoria/$slug" params={{ slug: p.category.slug }} className="hover:text-foreground">
              {p.category.name}
            </Link>
            <ChevronRight className="size-3" />
          </>
        )}
        <span className="line-clamp-1 text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
            {p.images?.[imageIdx] && (
              <img src={p.images[imageIdx]} alt={p.name} width={1024} height={1024} className="size-full object-cover" />
            )}
            {off > 0 && (
              <span className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-sm font-extrabold text-primary-foreground">
                -{off}%
              </span>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setImageIdx(i)}
                  className={cn("size-16 overflow-hidden rounded-lg border-2", i === imageIdx ? "border-primary" : "border-transparent")}
                >
                  <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          {p.is_demo && (
            <p className="mb-3 inline-block rounded-md bg-warning-soft px-2 py-1 text-xs font-semibold">
              Produto demonstrativo para testes
            </p>
          )}
          {p.brand && <p className="text-sm font-semibold text-muted-foreground">{p.brand}</p>}
          <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{p.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{p.sold_count}+ vendidos (dado demonstrativo)</p>

          <div className="mt-5 rounded-2xl bg-muted/70 p-4">
            {off > 0 && <p className="text-sm text-muted-foreground line-through">{formatBRL(p.compare_at_cents!)}</p>}
            <div className="flex items-baseline gap-3">
              <p className="price-tag text-4xl font-extrabold">{formatBRL(price)}</p>
              {off > 0 && <span className="text-sm font-extrabold text-primary">{off}% OFF</span>}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm">
              <CreditCard className="size-4 text-muted-foreground" />
              em até <strong>{inst.count}x de {formatBRL(inst.value)}</strong> no crédito
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm">
              <QrCode className="size-4 text-muted-foreground" />
              <strong>{formatBRL(pixPrice)}</strong> no Pix
            </p>
          </div>

          {variants.length > 1 || (variants[0] && variants[0].name !== "Padrão") ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold">
                Opção: <span className="font-medium text-muted-foreground">{variant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    onClick={() => {
                      setVariantId(v.id);
                      setQty(1);
                    }}
                    className={cn(
                      "relative min-w-12 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition",
                      v.id === variantId ? "border-primary bg-primary-soft text-primary-strong" : "border-border hover:border-foreground/40",
                      v.stock === 0 && "cursor-not-allowed text-muted-foreground line-through opacity-60",
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center rounded-lg border">
              <button className="grid size-10 place-items-center" aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-bold" aria-live="polite">{qty}</span>
              <button
                className="grid size-10 place-items-center"
                aria-label="Aumentar"
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className={cn("text-sm font-semibold", stock > 0 ? "text-success" : "text-destructive")}>
              {stock === 0 ? "Esgotado" : stock <= 5 ? `Últimas ${stock} unidades` : `Em estoque (${stock} disponíveis)`}
            </p>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button size="xl" disabled={stock === 0} onClick={() => add(true)}>
              <Zap /> Comprar agora
            </Button>
            <Button size="xl" variant="soft" disabled={stock === 0} onClick={() => add(false)}>
              <ShoppingCart /> Adicionar ao carrinho
            </Button>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-bold">Calcular frete e prazo</p>
            <ShippingCalculator subtotalCents={price * qty} items={qty} />
          </div>

          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Compra protegida e dados criptografados</li>
            <li className="flex items-center gap-2"><Check className="size-4 text-success" /> Estoque próprio ZENVORI</li>
          </ul>
        </div>
      </div>

      <section className="mt-10 max-w-3xl">
        <h2 className="mb-3 text-xl font-extrabold">Descrição</h2>
        <p className="whitespace-pre-line leading-7 text-foreground/85">{p.description}</p>
      </section>

      {related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">Você também pode gostar</h2>
          <ProductGrid products={related.filter((r) => r.id !== p.id).slice(0, 5)} />
        </section>
      )}
    </div>
  );
}

import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discountPercent, formatBRL, installments } from "@/lib/format";
import type { CatalogProduct } from "@/lib/catalog.functions";
import { cart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const off = discountPercent(product.price_cents, product.compare_at_cents);
  const variants = [...(product.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const inst = installments(product.price_cents);
  const singleVariant = variants.length === 1 ? variants[0] : null;

  function quickAdd(e: MouseEvent<HTMLButtonElement>) {
    if (!singleVariant) return; // multi-variant: link to product page handles it
    e.preventDefault();
    cart.add({
      variantId: singleVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: singleVariant.name,
      image: product.images?.[0] ?? null,
      priceCents: singleVariant.price_cents ?? product.price_cents,
      maxStock: singleVariant.stock,
    });
    toast.success("Adicionado ao carrinho", { description: product.name });
  }

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && product.compare_at_cents !== null && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-extrabold text-primary-foreground">
              -{off}%
            </span>
          )}
          {product.is_new && (
            <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold text-ink-foreground">Lançamento</span>
          )}
        </div>
        {product.is_demo && (
          <span className="absolute bottom-2 left-2 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Demo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{product.name}</p>
        <div className="mt-1">
          {off > 0 && product.compare_at_cents !== null && (
            <p className="text-xs text-muted-foreground line-through">{formatBRL(product.compare_at_cents)}</p>
          )}
          <p className="price-tag text-xl font-extrabold text-foreground">{formatBRL(product.price_cents)}</p>
          <p className="text-xs text-muted-foreground">
            ou {inst.count}x de {formatBRL(inst.value)}
          </p>
        </div>
        <div className="mt-auto pt-2">
          {totalStock === 0 ? (
            <Button variant="secondary" className="w-full" disabled>
              Esgotado
            </Button>
          ) : (
            <Button className="w-full" onClick={quickAdd}>
              <ShoppingCart /> Comprar
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

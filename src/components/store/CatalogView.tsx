import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "./ProductCard";
import type { CatalogProduct } from "@/lib/catalog.functions";
import type { CatalogSearch } from "@/lib/catalog-search";
import { validateCatalogSearch } from "@/lib/catalog-search";

type Category = { id: string; slug: string; name: string };

const PRICE_RANGES = [
  { label: "Até R$ 100", min: undefined, max: 100 },
  { label: "R$ 100 a R$ 200", min: 100, max: 200 },
  { label: "R$ 200 a R$ 400", min: 200, max: 400 },
  { label: "Acima de R$ 400", min: 400, max: undefined },
];

export function CatalogView({
  title,
  subtitle,
  products,
  categories,
  search,
  onChange,
  showCategoryFilter = true,
  activeCategory,
}: {
  title: string;
  subtitle?: string | undefined;
  products: CatalogProduct[];
  categories: Category[];
  search: CatalogSearch;
  onChange: (next: CatalogSearch) => void;
  showCategoryFilter?: boolean;
  activeCategory?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");

  const filters = (
    <div className="space-y-6">
      {showCategoryFilter && (
        <div>
          <p className="mb-2 text-sm font-extrabold">Categoria</p>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onChange({ ...search, categoria: undefined })}
                className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${!activeCategory ? "bg-primary-soft font-bold text-primary-strong" : "hover:bg-muted"}`}
              >
                Todas
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onChange({ ...search, categoria: c.slug })}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${activeCategory === c.slug ? "bg-primary-soft font-bold text-primary-strong" : "hover:bg-muted"}`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="mb-2 text-sm font-extrabold">Preço</p>
        <ul className="space-y-1">
          {PRICE_RANGES.map((r) => {
            const active = search.min === r.min && search.max === r.max;
            return (
              <li key={r.label}>
                <button
                  onClick={() => {
                    setMin(r.min?.toString() ?? "");
                    setMax(r.max?.toString() ?? "");
                    onChange({ ...search, min: r.min, max: r.max });
                  }}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${active ? "bg-primary-soft font-bold text-primary-strong" : "hover:bg-muted"}`}
                >
                  {r.label}
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ ...search, min: min ? Number(min) : undefined, max: max ? Number(max) : undefined });
            setOpen(false);
          }}
        >
          <input
            inputMode="numeric"
            placeholder="Mín"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
            className="h-9 w-full rounded-md border border-input px-2 text-sm outline-none focus:border-primary"
            aria-label="Preço mínimo"
          />
          <span className="text-muted-foreground">–</span>
          <input
            inputMode="numeric"
            placeholder="Máx"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
            className="h-9 w-full rounded-md border border-input px-2 text-sm outline-none focus:border-primary"
            aria-label="Preço máximo"
          />
          <Button type="submit" size="sm" variant="ink">OK</Button>
        </form>
      </div>
    </div>
  );

  const hasFilters = search.min !== undefined || search.max !== undefined || !!search.flag || !!search.q;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {subtitle ? `${subtitle} · ` : ""}
            {products.length} {products.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="md:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal /> Filtros
          </Button>
          <select
            aria-label="Ordenar por"
            value={search.sort ?? "mais-vendidos"}
            onChange={(e) => onChange({ ...search, sort: validateCatalogSearch({ sort: e.target.value }).sort })}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus:border-primary"
          >
            <option value="mais-vendidos">Mais vendidos</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="novidades">Novidades</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search.q && <Chip label={`“${search.q}”`} onClear={() => onChange({ ...search, q: undefined })} />}
          {search.flag && (
            <Chip
              label={search.flag === "deals" ? "Ofertas" : search.flag === "new" ? "Lançamentos" : "Destaques"}
              onClear={() => onChange({ ...search, flag: undefined })}
            />
          )}
          {(search.min !== undefined || search.max !== undefined) && (
            <Chip
              label={`R$ ${search.min ?? 0} – ${search.max !== undefined ? `R$ ${search.max}` : "∞"}`}
              onClear={() => {
                setMin("");
                setMax("");
                onChange({ ...search, min: undefined, max: undefined });
              }}
            />
          )}
        </div>
      )}

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 md:block">{filters}</aside>
        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="font-display text-lg font-bold">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou remova alguns filtros.</p>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-bold">Filtros</p>
              <button onClick={() => setOpen(false)} aria-label="Fechar filtros">
                <X className="size-5" />
              </button>
            </div>
            <div onClick={(e) => { if (e.target instanceof Element && e.target.closest("button")) setOpen(false); }}>{filters}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
      {label}
      <button onClick={onClear} aria-label={`Remover filtro ${label}`}>
        <X className="size-3.5" />
      </button>
    </span>
  );
}

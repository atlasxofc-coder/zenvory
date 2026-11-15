import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Sparkles, TrendingUp } from "lucide-react";
import hero from "@/assets/hero-campaign.jpg";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/ProductCard";
import { CategoryIcon } from "@/components/store/CategoryIcon";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";

const DEALS = { flag: "deals" as const, limit: 10 };
const NEW = { flag: "new" as const, sort: "novidades" as const, limit: 10 };
const POPULAR = { sort: "mais-vendidos" as const, limit: 10 };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "ZENVORI — Ofertas em eletrônicos, casa, moda e mais" },
      { name: "description", content: "Ofertas do dia, lançamentos e os produtos mais vendidos da ZENVORI, com entrega para todo o Brasil." },
      { property: "og:title", content: "ZENVORI — Ofertas em eletrônicos, casa, moda e mais" },
      { property: "og:description", content: "Ofertas do dia, lançamentos e os mais vendidos com entrega para todo o Brasil." },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(categoriesQuery()),
      queryClient.ensureQueryData(productsQuery(DEALS)),
      queryClient.ensureQueryData(productsQuery(NEW)),
      queryClient.ensureQueryData(productsQuery(POPULAR)),
    ]),
  component: Home,
});

function Section({
  icon: Icon,
  title,
  to,
  children,
  tone = "default",
}: {
  icon: typeof Flame;
  title: string;
  to: { flag?: "deals" | "new"; sort?: "mais-vendidos" | "novidades" };
  children: ReactNode;
  tone?: "default" | "hot";
}) {
  return (
    <section className="mx-auto mt-10 max-w-7xl px-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-extrabold md:text-2xl">
          <span
            className={
              tone === "hot"
                ? "grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"
                : "grid size-9 place-items-center rounded-lg bg-ink text-ink-foreground"
            }
          >
            <Icon className="size-5" />
          </span>
          {title}
        </h2>
        <Link to="/busca" search={to} className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          Ver tudo <ArrowRight className="size-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: deals } = useSuspenseQuery(productsQuery(DEALS));
  const { data: fresh } = useSuspenseQuery(productsQuery(NEW));
  const { data: popular } = useSuspenseQuery(productsQuery(POPULAR));

  return (
    <div className="pb-6">
      {/* Campaign banner */}
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-primary">
          <img
            src={hero}
            alt="Campanha ZENVORI com smartwatch, fone, tênis e garrafa"
            width={1920}
            height={800}
            className="absolute inset-0 size-full object-cover object-right"
          />
          <div className="relative flex min-h-[260px] max-w-xl flex-col justify-center gap-4 p-6 md:min-h-[380px] md:p-12">
            <span className="w-fit rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink-foreground">
              Campanha de lançamento · demo
            </span>
            <h1 className="text-3xl font-extrabold leading-[1.05] text-primary-foreground md:text-5xl">
              Semana ZEN de ofertas
            </h1>
            <p className="max-w-sm text-base font-medium text-primary-foreground/90 md:text-lg">
              Até 33% off em eletrônicos, esportes e casa. Frete grátis acima de R$ 199 no Sudeste.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="ink" size="lg">
                <Link to="/busca" search={{ flag: "deals" }}>
                  Aproveitar ofertas <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto mt-6 max-w-7xl px-4">
        <ul className="flex gap-3 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-6">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="group flex w-24 flex-col items-center gap-2 rounded-xl p-2 text-center md:w-auto"
              >
                <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground md:size-20">
                  <CategoryIcon name={c.icon} className="size-7 md:size-8" />
                </span>
                <span className="text-xs font-semibold md:text-sm">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Promo strip */}
      <section className="mx-auto mt-8 max-w-7xl px-4">
        <div className="promo-stripes flex flex-col items-start justify-between gap-3 rounded-2xl p-5 text-primary-foreground md:flex-row md:items-center">
          <p className="font-display text-lg font-extrabold md:text-xl">Pague com Pix, crédito ou débito</p>
          <p className="text-sm font-semibold">Parcele em até 10x no cartão de crédito</p>
        </div>
      </section>

      <Section icon={Flame} title="Ofertas do dia" to={{ flag: "deals" }} tone="hot">
        <ProductGrid products={deals} />
      </Section>

      <Section icon={Sparkles} title="Lançamentos" to={{ flag: "new" }}>
        <ProductGrid products={fresh} />
      </Section>

      <Section icon={TrendingUp} title="Mais vendidos" to={{ sort: "mais-vendidos" }}>
        <ProductGrid products={popular} />
      </Section>
    </div>
  );
}

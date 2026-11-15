import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CatalogView } from "@/components/store/CatalogView";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";
import { validateCatalogSearch } from "@/lib/catalog-search";

export const Route = createFileRoute("/busca")({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(categoriesQuery()),
      queryClient.ensureQueryData(productsQuery({ ...deps, category: deps.categoria })),
    ]),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Buscar produtos | ZENVORI" },
      { name: "description", content: "Pesquise produtos da ZENVORI por nome, filtre por preço e categoria." },
      { property: "og:title", content: "Buscar produtos | ZENVORI" },
      { property: "og:description", content: "Pesquise e filtre produtos por preço e categoria na ZENVORI." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/busca" });
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery({ ...search, category: search.categoria }));
  const title = search.q
    ? `Resultados para “${search.q}”`
    : search.flag === "deals"
      ? "Ofertas do dia"
      : search.flag === "new"
        ? "Lançamentos"
        : "Todos os produtos";
  return (
    <CatalogView
      title={title}
      products={products}
      categories={categories}
      search={search}
      activeCategory={search.categoria}
      onChange={(next) => navigate({ to: ".", search: next })}
    />
  );
}

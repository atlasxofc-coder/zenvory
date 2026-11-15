import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CatalogView } from "@/components/store/CatalogView";
import { categoriesQuery, productsQuery } from "@/lib/catalog.queries";
import { validateCatalogSearch } from "@/lib/catalog-search";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, deps }) => {
    const cats = await queryClient.ensureQueryData(categoriesQuery());
    const category = cats.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    await queryClient.ensureQueryData(productsQuery({ ...deps, category: params.slug }));
    return { name: category.name, description: category.description };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { name: "twitter:card", content: "summary_large_image" },
          { title: `${loaderData.name} | ZENVORI` },
          { property: "og:type", content: "website" },
          { name: "description", content: `${loaderData.name} na ZENVORI: ${loaderData.description ?? "ofertas e lançamentos"}.` },
          { property: "og:title", content: `${loaderData.name} | ZENVORI` },
          { property: "og:description", content: `Compre ${loaderData.name.toLowerCase()} com entrega para todo o Brasil.` },
        ]
      : [{ title: "Categoria indisponível | ZENVORI" }, { name: "description", content: "Categoria indisponível na ZENVORI." }, { property: "og:title", content: "Categoria indisponível | ZENVORI" }, { property: "og:description", content: "Categoria indisponível na ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/categoria/$slug" });
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery({ ...search, category: slug }));
  const category = categories.find((c) => c.slug === slug);
  if (!category) throw notFound();
  return (
    <CatalogView
      title={category.name}
      subtitle={category.description ?? undefined}
      products={products}
      categories={categories}
      search={search}
      activeCategory={slug}
      onChange={(next) => {
        if (next.categoria && next.categoria !== slug) {
          navigate({ to: "/categoria/$slug", params: { slug: next.categoria }, search: { ...next, categoria: undefined } });
        } else if ("categoria" in next && next.categoria === undefined && Object.prototype.hasOwnProperty.call(next, "categoria")) {
          navigate({ to: "/busca", search: { ...next, categoria: undefined } });
        } else {
          navigate({ to: ".", search: next });
        }
      }}
    />
  );
}

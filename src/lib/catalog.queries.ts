import { queryOptions } from "@tanstack/react-query";
import { getProduct, listCategories, listProducts, type CatalogFilters } from "./catalog.functions";

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories(), staleTime: 5 * 60_000 });

export const productsQuery = (filters: CatalogFilters) =>
  queryOptions({ queryKey: ["products", filters], queryFn: () => listProducts({ data: filters }), staleTime: 60_000 });

export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }), staleTime: 30_000 });

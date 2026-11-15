import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_FIELDS =
  "id, slug, name, description, brand, price_cents, compare_at_cents, images, is_featured, is_new, is_demo, sold_count, created_at, category:categories(id, slug, name), variants:product_variants(id, name, sku, price_cents, stock, sort_order)";

export type CatalogFilters = {
  category?: string | undefined;
  q?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: "relevancia" | "menor-preco" | "maior-preco" | "mais-vendidos" | "novidades" | undefined;
  flag?: "featured" | "new" | "deals" | undefined;
  limit?: number | undefined;
};

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: CatalogFilters) => input ?? {})
  .handler(async ({ data: f }) => {
    const sb = publicClient();
    let categoryId: string | undefined;
    if (f.category) {
      const { data: c } = await sb.from("categories").select("id").eq("slug", f.category).maybeSingle();
      if (!c) return [];
      categoryId = c.id;
    }
    let q = sb.from("products").select(PRODUCT_FIELDS).eq("is_active", true);
    if (categoryId) q = q.eq("category_id", categoryId);
    if (f.q) {
      const term = f.q.replace(/[%,()]/g, " ").trim();
      if (term) q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (typeof f.min === "number") q = q.gte("price_cents", Math.round(f.min * 100));
    if (typeof f.max === "number") q = q.lte("price_cents", Math.round(f.max * 100));
    if (f.flag === "featured") q = q.eq("is_featured", true);
    if (f.flag === "new") q = q.eq("is_new", true);
    if (f.flag === "deals") q = q.not("compare_at_cents", "is", null);
    switch (f.sort) {
      case "menor-preco":
        q = q.order("price_cents", { ascending: true });
        break;
      case "maior-preco":
        q = q.order("price_cents", { ascending: false });
        break;
      case "novidades":
        q = q.order("created_at", { ascending: false });
        break;
      default:
        q = q.order("sold_count", { ascending: false });
    }
    if (f.limit) q = q.limit(f.limit);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { data: p, error } = await publicClient()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return p;
  });

export type CatalogProduct = Awaited<ReturnType<typeof listProducts>>[number];

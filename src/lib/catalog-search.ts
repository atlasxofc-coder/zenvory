import type { CatalogFilters } from "./catalog.functions";

export type CatalogSearch = {
  q?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: NonNullable<CatalogFilters["sort"]> | undefined;
  flag?: NonNullable<CatalogFilters["flag"]> | undefined;
  categoria?: string | undefined;
};

const SORTS = ["relevancia", "menor-preco", "maior-preco", "mais-vendidos", "novidades"] as const;
const FLAGS = ["featured", "new", "deals"] as const;

function num(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function validateCatalogSearch(s: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {};
  if (typeof s["q"] === "string" && s["q"].trim()) out.q = s["q"].trim().slice(0, 80);
  const min = num(s["min"]);
  const max = num(s["max"]);
  if (min !== undefined) out.min = min;
  if (max !== undefined) out.max = max;
  out.sort = SORTS.find((sort) => sort === s["sort"]);
  out.flag = FLAGS.find((flag) => flag === s["flag"]);
  if (typeof s["categoria"] === "string" && /^[a-z0-9-]{1,60}$/.test(s["categoria"])) out.categoria = s["categoria"];
  return out;
}

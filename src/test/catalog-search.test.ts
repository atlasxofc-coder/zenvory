import { describe, expect, it } from "vitest";
import { validateCatalogSearch } from "@/lib/catalog-search";

describe("Catalog search validation", () => {
  it("retains supported ordering and numeric price filters", () => {
    expect(validateCatalogSearch({ sort: "menor-preco", min: "100", max: "200", categoria: "eletronicos" })).toEqual({ sort: "menor-preco", flag: undefined, min: 100, max: 200, categoria: "eletronicos" });
  });
  it("drops invalid filters and supports clearing optional filters", () => {
    const filters = validateCatalogSearch({ sort: "invalid", flag: "invalid", min: -1, max: "bad", categoria: "../" });
    expect(filters.sort).toBeUndefined();
    expect(filters.flag).toBeUndefined();
    expect(filters.min).toBeUndefined();
    expect(filters.max).toBeUndefined();
    expect(filters.categoria).toBeUndefined();
    expect(validateCatalogSearch({ ...filters, flag: "deals", min: undefined }).flag).toBe("deals");
  });
});
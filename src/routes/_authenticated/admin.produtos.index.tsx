import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  head: () => ({ meta: [{ title: "Administrar produtos | ZENVORI" }, { name: "description", content: "Consulte produtos e estoque da ZENVORI." }, { property: "og:title", content: "Administrar produtos | ZENVORI" }, { property: "og:description", content: "Consulte produtos e estoque da ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }), component: AdminProducts });

function AdminProducts() {
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price_cents, is_active, is_demo, images, product_variants(stock)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <Button asChild className="mb-4"><Link to="/admin/produtos/$id" params={{ id: "novo" }}><Plus /> Novo produto</Link></Button>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs"><tr><th className="p-3">Produto</th><th className="p-3">Preço</th><th className="p-3">Estoque</th><th className="p-3">Situação</th></tr></thead>
          <tbody>
            {data?.map((p) => {
              const stock = p.product_variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="p-3"><Link to="/admin/produtos/$id" params={{ id: p.id }} className="flex items-center gap-3 font-semibold hover:text-primary">
                    <span className="size-10 overflow-hidden rounded bg-muted">{p.images[0] && <img src={p.images[0]} alt="" className="size-full object-cover" />}</span>{p.name}
                  </Link></td>
                  <td className="p-3">{formatBRL(p.price_cents)}</td>
                  <td className={`p-3 font-bold ${stock === 0 ? "text-destructive" : ""}`}>{stock}</td>
                  <td className="p-3 text-xs">{p.is_active ? "Ativo" : "Inativo"}{p.is_demo ? " · Demo" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

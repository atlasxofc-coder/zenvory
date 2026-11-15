import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar produto | ZENVORI" }, { name: "description", content: "Edite os dados e variações de um produto ZENVORI." }, { property: "og:title", content: "Editar produto | ZENVORI" }, { property: "og:description", content: "Edite os dados e variações de um produto ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }), component: EditProduct });

type V = { id?: string; name: string; stock: number };

function EditProduct() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: cats } = useQuery({ queryKey: ["admin-cats"], queryFn: async () => (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [] });
  const { data } = useQuery({
    queryKey: ["admin-product", id], enabled: !isNew,
    queryFn: async () => (await supabase.from("products").select("*, product_variants(id, name, stock)").eq("id", id).single()).data,
  });
  const [f, setF] = useState({ name: "", slug: "", description: "", price: "", compare: "", category_id: "", images: "", is_active: true });
  const [vars, setVars] = useState<V[]>([{ name: "Padrão", stock: 0 }]);
  useEffect(() => {
    if (!data) return;
    setF({ name: data.name, slug: data.slug, description: data.description, price: (data.price_cents / 100).toString(), compare: data.compare_at_cents ? (data.compare_at_cents / 100).toString() : "", category_id: data.category_id ?? "", images: data.images.join("\n"), is_active: data.is_active });
    setVars(data.product_variants.map((v) => ({ id: v.id, name: v.name, stock: v.stock })));
  }, [data]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const row = {
      name: f.name, slug: f.slug || f.name.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-"),
      description: f.description, price_cents: Math.round(Number(f.price.replace(",", ".")) * 100),
      compare_at_cents: f.compare ? Math.round(Number(f.compare.replace(",", ".")) * 100) : null,
      category_id: f.category_id || null, images: f.images.split("\n").map((s) => s.trim()).filter(Boolean), is_active: f.is_active,
    };
    const res = isNew ? await supabase.from("products").insert(row).select("id").single() : await supabase.from("products").update(row).eq("id", id).select("id").single();
    if (res.error) { toast.error(res.error.message); return; }
    const pid = res.data.id;
    for (const [i, v] of vars.entries()) {
      const r = v.id ? await supabase.from("product_variants").update({ name: v.name, stock: v.stock, sort_order: i }).eq("id", v.id)
        : await supabase.from("product_variants").insert({ product_id: pid, name: v.name, stock: v.stock, sort_order: i });
      if (r.error) { toast.error(r.error.message); return; }
    }
    toast.success("Produto salvo"); qc.invalidateQueries(); navigate({ to: "/admin/produtos" });
  }
  async function remove() {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries(); navigate({ to: "/admin/produtos" });
  }
  const input = "h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary";
  return (
    <form onSubmit={save} className="max-w-2xl space-y-3 text-sm">
      <Link to="/admin/produtos" className="text-muted-foreground">← Produtos</Link>
      <input required className={input} placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={input} placeholder="Endereço (slug) — opcional" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
      <textarea className={`${input} h-28 py-2`} placeholder="Descrição" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input required className={input} placeholder="Preço (R$)" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className={input} placeholder="Preço anterior (R$)" value={f.compare} onChange={(e) => setF({ ...f, compare: e.target.value })} />
      </div>
      <select className={input} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
        <option value="">Sem categoria</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <textarea className={`${input} h-20 py-2`} placeholder="Links das fotos (um por linha)" value={f.images} onChange={(e) => setF({ ...f, images: e.target.value })} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Ativo na loja</label>
      <p className="pt-2 font-bold">Variações e estoque</p>
      {vars.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={input} value={v.name} onChange={(e) => setVars(vars.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <input type="number" min={0} className={`${input} w-28`} value={v.stock} onChange={(e) => setVars(vars.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setVars([...vars, { name: "", stock: 0 }])}>+ Variação</Button>
      <div className="flex gap-2 pt-2"><Button type="submit">Salvar</Button>{!isNew && <Button type="button" variant="ghost" onClick={remove}>Excluir</Button>}</div>
    </form>
  );
}

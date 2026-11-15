import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressForm, type AddressInput } from "@/components/store/AddressForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta/enderecos")({
  head: () => ({ meta: [{ title: "Meus endereços | ZENVORI" }, { name: "description", content: "Consulte seus endereços de entrega na ZENVORI." }, { property: "og:title", content: "Meus endereços | ZENVORI" }, { property: "og:description", content: "Consulte seus endereços de entrega na ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: AddressesPage,
});

function AddressesPage() {
  const qc = useQueryClient();
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  async function save(a: AddressInput) {
    if (!editing) return;
    setBusy(true);
    const { error } =
      editing === "new"
        ? await supabase.from("addresses").insert({ ...a, is_default: (addresses?.length ?? 0) === 0 })
        : await supabase.from("addresses").update(a).eq("id", editing);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEditing(null);
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function makeDefault(id: string) {
    await supabase.from("addresses").update({ is_default: false }).neq("id", id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    refresh();
  }

  return (
    <section className="rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Endereços de entrega</h2>
        {editing === null && <Button size="sm" onClick={() => setEditing("new")}><Plus /> Adicionar</Button>}
      </div>
      {editing === "new" && (
        <div className="mb-4 rounded-xl border p-4"><AddressForm onSubmit={save} onCancel={() => setEditing(null)} busy={busy} /></div>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : addresses?.length === 0 && editing !== "new" ? (
        <p className="text-sm text-muted-foreground">Você ainda não cadastrou endereços.</p>
      ) : (
        <ul className="space-y-3">
          {addresses?.map((a) =>
            editing === a.id ? (
              <li key={a.id} className="rounded-xl border p-4">
                <AddressForm
                  initial={{ label: a.label, recipient: a.recipient, phone: a.phone ?? "", cep: a.cep, street: a.street, number: a.number, complement: a.complement ?? "", district: a.district, city: a.city, state: a.state }}
                  onSubmit={save}
                  onCancel={() => setEditing(null)}
                  busy={busy}
                />
              </li>
            ) : (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4">
                <div className="text-sm">
                  <p className="font-bold">
                    {a.label} {a.is_default && <span className="ml-1 rounded bg-primary-soft px-1.5 py-0.5 text-[11px] text-primary-strong">Padrão</span>}
                  </p>
                  <p>{a.recipient}</p>
                  <p className="text-muted-foreground">
                    {a.street}, {a.number}{a.complement ? ` – ${a.complement}` : ""} · {a.district} · {a.city}/{a.state} · CEP {a.cep}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!a.is_default && <Button size="sm" variant="ghost" onClick={() => makeDefault(a.id)}><Star /> Tornar padrão</Button>}
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditing(a.id)}><Pencil /></Button>
                  <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remove(a.id)}><Trash2 /></Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

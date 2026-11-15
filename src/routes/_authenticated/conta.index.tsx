import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta/")({
  head: () => ({ meta: [{ title: "Meus dados | ZENVORI" }, { name: "description", content: "Consulte seus dados pessoais na ZENVORI." }, { property: "og:title", content: "Meus dados | ZENVORI" }, { property: "og:description", content: "Consulte seus dados pessoais na ZENVORI." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ full_name: "", phone: "", cpf: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "", cpf: profile.cpf ?? "" });
  }, [profile]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...form });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast.success("Dados atualizados");
  }

  const input = "h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary";
  return (
    <section className="rounded-2xl border p-5">
      <h2 className="mb-4 text-lg font-extrabold">Meus dados</h2>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold" htmlFor="p-email">E-mail</label>
          <input id="p-email" value={user.email ?? ""} disabled className={`${input} bg-muted`} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold" htmlFor="p-name">Nome completo</label>
          <input id="p-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold" htmlFor="p-phone">Telefone</label>
          <input id="p-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold" htmlFor="p-cpf">CPF</label>
          <input id="p-cpf" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className={input} placeholder="Necessário para nota fiscal" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
        </div>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">Seus dados pessoais só são visíveis para você e para a administração da loja.</p>
    </section>
  );
}

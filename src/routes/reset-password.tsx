import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Redefinir senha | ZENVORI" },
      { name: "description", content: "Defina uma nova senha para sua conta ZENVORI." },
      { property: "og:title", content: "Redefinir senha | ZENVORI" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/conta" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border p-6 shadow-card">
        <h1 className="text-2xl font-extrabold">Nova senha</h1>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo de 8 caracteres"
          className="h-11 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>Salvar nova senha</Button>
      </form>
    </div>
  );
}

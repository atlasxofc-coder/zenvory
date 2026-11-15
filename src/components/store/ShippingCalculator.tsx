import { useState, type FormEvent } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, formatCEP, onlyDigits } from "@/lib/format";

export type ShippingQuote = { service: string; price_cents: number; min_days: number; max_days: number; is_demo: boolean };

export function ShippingCalculator({
  subtotalCents,
  items,
  onQuotes,
  compact,
}: {
  subtotalCents: number;
  items: number;
  onQuotes?: (cep: string, quotes: ShippingQuote[]) => void;
  compact?: boolean;
}) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function calc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (onlyDigits(cep).length !== 8) {
      setError("Digite um CEP válido com 8 dígitos.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("quote_shipping", {
      _cep: cep,
      _subtotal_cents: subtotalCents,
      _items: Math.max(1, items),
    });
    setLoading(false);
    if (error) return setError(error.message);
    setQuotes(data ?? []);
    onQuotes?.(cep, data ?? []);
  }

  return (
    <div className={compact ? "" : "rounded-xl border p-4"}>
      <form onSubmit={calc} className="flex gap-2">
        <label className="sr-only" htmlFor="cep-calc">CEP</label>
        <input
          id="cep-calc"
          inputMode="numeric"
          placeholder="Digite seu CEP"
          value={cep}
          onChange={(e) => setCep(formatCEP(e.target.value))}
          className="h-10 flex-1 rounded-lg border border-input px-3 text-sm outline-none focus:border-primary"
        />
        <Button type="submit" variant="ink" disabled={loading}>
          {loading ? "Calculando…" : "Calcular"}
        </Button>
      </form>
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-xs text-muted-foreground underline"
      >
        Não sei meu CEP
      </a>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {quotes && quotes.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Ainda não entregamos neste CEP.</p>
      )}
      {quotes && quotes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {quotes.map((q) => (
            <li key={q.service} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Truck className="size-4 text-success" />
                <span>
                  <strong>{q.service}</strong>{" "}
                  <span className="text-muted-foreground">
                    · {q.min_days} a {q.max_days} dias úteis
                  </span>
                </span>
              </span>
              <span className={q.price_cents === 0 ? "font-bold text-success" : "font-semibold"}>
                {q.price_cents === 0 ? "Grátis" : formatBRL(q.price_cents)}
              </span>
            </li>
          ))}
          {quotes.some((q) => q.is_demo) && (
            <li className="text-xs text-muted-foreground">Valores de tabela demonstrativa — sem transportadora integrada.</li>
          )}
        </ul>
      )}
    </div>
  );
}

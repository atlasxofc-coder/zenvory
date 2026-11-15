import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatCEP, onlyDigits } from "@/lib/format";

export type AddressInput = {
  label: string;
  recipient: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

export const EMPTY_ADDRESS: AddressInput = {
  label: "Casa",
  recipient: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export function AddressForm({
  initial = EMPTY_ADDRESS,
  submitLabel = "Salvar endereço",
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: AddressInput;
  submitLabel?: string;
  onSubmit: (a: AddressInput) => void | Promise<void>;
  onCancel?: (() => void) | undefined;
  busy?: boolean;
}) {
  const [a, setA] = useState<AddressInput>(initial);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const set = (k: keyof AddressInput) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setA((p) => ({ ...p, [k]: e.target.value }));

  async function lookupCep(cep: string) {
    const d = onlyDigits(cep);
    if (d.length !== 8) return;
    setCepMsg("Buscando endereço…");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await res.json();
      if (j.erro) return setCepMsg("CEP não encontrado. Preencha manualmente.");
      setA((p) => ({ ...p, street: j.logradouro || p.street, district: j.bairro || p.district, city: j.localidade || p.city, state: j.uf || p.state }));
      setCepMsg(null);
    } catch {
      setCepMsg("Não foi possível buscar o CEP. Preencha manualmente.");
    }
  }

  const input = "h-10 w-full rounded-lg border border-input px-3 text-sm outline-none focus:border-primary";
  const label = "mb-1 block text-xs font-bold";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...a, cep: formatCEP(a.cep) });
      }}
      className="grid grid-cols-6 gap-3"
    >
      <div className="col-span-6 sm:col-span-2">
        <label className={label} htmlFor="a-cep">CEP</label>
        <input
          id="a-cep"
          required
          inputMode="numeric"
          value={a.cep}
          onChange={(e) => {
            const v = formatCEP(e.target.value);
            setA((p) => ({ ...p, cep: v }));
            if (onlyDigits(v).length === 8) lookupCep(v);
          }}
          className={input}
        />
        {cepMsg && <p className="mt-1 text-xs text-muted-foreground">{cepMsg}</p>}
      </div>
      <div className="col-span-6 sm:col-span-4">
        <label className={label} htmlFor="a-recipient">Nome do destinatário</label>
        <input id="a-recipient" required value={a.recipient} onChange={set("recipient")} className={input} autoComplete="name" />
      </div>
      <div className="col-span-6 sm:col-span-4">
        <label className={label} htmlFor="a-street">Rua / Avenida</label>
        <input id="a-street" required value={a.street} onChange={set("street")} className={input} autoComplete="address-line1" />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className={label} htmlFor="a-number">Número</label>
        <input id="a-number" required value={a.number} onChange={set("number")} className={input} />
      </div>
      <div className="col-span-4 sm:col-span-3">
        <label className={label} htmlFor="a-complement">Complemento</label>
        <input id="a-complement" value={a.complement} onChange={set("complement")} className={input} placeholder="Apto, bloco (opcional)" />
      </div>
      <div className="col-span-6 sm:col-span-3">
        <label className={label} htmlFor="a-district">Bairro</label>
        <input id="a-district" required value={a.district} onChange={set("district")} className={input} />
      </div>
      <div className="col-span-4">
        <label className={label} htmlFor="a-city">Cidade</label>
        <input id="a-city" required value={a.city} onChange={set("city")} className={input} />
      </div>
      <div className="col-span-2">
        <label className={label} htmlFor="a-state">UF</label>
        <select id="a-state" required value={a.state} onChange={set("state")} className={input}>
          <option value="">—</option>
          {UFS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="col-span-3">
        <label className={label} htmlFor="a-phone">Telefone</label>
        <input id="a-phone" value={a.phone} onChange={set("phone")} className={input} inputMode="tel" autoComplete="tel" />
      </div>
      <div className="col-span-3">
        <label className={label} htmlFor="a-label">Identificação</label>
        <input id="a-label" value={a.label} onChange={set("label")} className={input} placeholder="Casa, Trabalho…" />
      </div>
      <div className="col-span-6 flex gap-2 pt-1">
        <Button type="submit" disabled={busy}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}

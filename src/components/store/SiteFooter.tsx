import { Link } from "@tanstack/react-router";
import { CreditCard, QrCode, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/60">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Truck, t: "Entrega para todo o Brasil", d: "Frete calculado pelo CEP" },
          { icon: QrCode, t: "Pix", d: "Aprovação após confirmação do banco" },
          { icon: CreditCard, t: "Crédito e débito", d: "Parcelamento no cartão de crédito" },
          { icon: ShieldCheck, t: "Compra protegida", d: "Seus dados pessoais seguros" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <Logo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            <Link to="/busca" className="hover:text-foreground">Todos os produtos</Link>
            <Link to="/conta" className="hover:text-foreground">Minha conta</Link>
            <Link to="/conta/pedidos" className="hover:text-foreground">Meus pedidos</Link>
            <Link to="/carrinho" className="hover:text-foreground">Carrinho</Link>
          </nav>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ZENVORI · Loja em fase de testes</p>
        </div>
      </div>
    </footer>
  );
}

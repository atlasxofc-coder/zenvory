import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { LayoutDashboard, Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { categoriesQuery } from "@/lib/catalog.queries";
import { useAuthUser, useIsAdmin } from "@/hooks/use-auth";

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useAuthUser();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: categories } = useQuery(categoriesQuery());
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate({ to: "/busca", search: { q: q.trim() || undefined } });
  }

  const search = (
    <form onSubmit={submit} role="search" className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar produtos, marcas e categorias"
        aria-label="Buscar produtos"
        className="h-11 w-full rounded-full border-2 border-foreground/90 bg-background pl-5 pr-14 text-sm outline-none transition focus:border-primary"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1 grid h-9 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-strong"
      >
        <Search className="size-4" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="bg-ink text-ink-foreground">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs font-medium">
          Ambiente de demonstração · produtos, frete e pedidos de teste · nenhum pagamento real é processado
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-8">
        <Logo />
        <div className="hidden flex-1 md:block">{search}</div>
        <nav className="ml-auto flex items-center gap-1 md:ml-0">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted sm:flex"
            >
              <LayoutDashboard className="size-5" /> Painel
            </Link>
          )}
          <Link
            to={user ? "/conta" : "/auth"}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-muted sm:px-3"
          >
            <User className="size-5" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[11px] font-medium text-muted-foreground">
                {user ? "Olá!" : "Bem-vindo"}
              </span>
              {user ? "Minha conta" : "Entrar / Cadastrar"}
            </span>
          </Link>
          <Link
            to="/carrinho"
            aria-label={`Carrinho com ${count} itens`}
            className="relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold hover:bg-muted sm:px-3"
          >
            <ShoppingCart className="size-5" />
            <span className="hidden sm:block">Carrinho</span>
            {count > 0 && (
              <span className="absolute -top-0.5 left-5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">{search}</div>
      <nav aria-label="Categorias" className="border-t">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 scrollbar-none">
          <li>
            <Link
              to="/busca"
              search={{ flag: "deals" }}
              className="block whitespace-nowrap px-3 py-2.5 text-sm font-bold text-primary"
            >
              Ofertas do dia
            </Link>
          </li>
          {categories?.map((c) => (
            <li key={c.id}>
              <Link
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="block whitespace-nowrap px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

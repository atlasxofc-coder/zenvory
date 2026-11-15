-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'customer');
create type public.order_status as enum ('awaiting_payment','payment_approved','preparing','shipped','out_for_delivery','delivered','canceled');
create type public.payment_status as enum ('pending','approved','refused','refunded','canceled');
create type public.payment_method as enum ('pix','credit_card','debit_card');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  cpf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Users read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users insert own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ CATALOG ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone reads categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  brand text,
  category_id uuid references public.categories(id) on delete set null,
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_demo boolean not null default false,
  sold_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone reads active products" on public.products for select to anon, authenticated
  using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price_cents int check (price_cents is null or price_cents >= 0),
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "Anyone reads variants of active products" on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.has_role(auth.uid(), 'admin'))));
create policy "Admins manage variants" on public.product_variants for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ ADDRESSES ============
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  label text not null default 'Casa',
  recipient text not null,
  phone text,
  cep text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses(user_id);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "Owners read addresses" on public.addresses for select to authenticated using (user_id = auth.uid());
create policy "Owners insert addresses" on public.addresses for insert to authenticated with check (user_id = auth.uid());
create policy "Owners update addresses" on public.addresses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners delete addresses" on public.addresses for delete to authenticated using (user_id = auth.uid());

-- ============ SHIPPING (demo rate table) ============
create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  cep_prefix_start int not null check (cep_prefix_start between 0 and 99),
  cep_prefix_end int not null check (cep_prefix_end between 0 and 99),
  base_cents int not null,
  per_item_cents int not null default 0,
  min_days int not null,
  max_days int not null,
  free_over_cents int,
  is_demo boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.shipping_rates to anon, authenticated;
grant insert, update, delete on public.shipping_rates to authenticated;
grant all on public.shipping_rates to service_role;
alter table public.shipping_rates enable row level security;
create policy "Anyone reads active rates" on public.shipping_rates for select to anon, authenticated using (active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage rates" on public.shipping_rates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.quote_shipping(_cep text, _subtotal_cents int, _items int)
returns table(service text, price_cents int, min_days int, max_days int, is_demo boolean)
language plpgsql stable security definer set search_path = public as $$
declare digits text := regexp_replace(coalesce(_cep, ''), '\D', '', 'g');
declare prefix int;
begin
  if length(digits) <> 8 then raise exception 'CEP inválido'; end if;
  prefix := left(digits, 2)::int;
  return query
    select r.service,
      case when r.free_over_cents is not null and _subtotal_cents >= r.free_over_cents then 0
           else r.base_cents + r.per_item_cents * greatest(coalesce(_items, 1) - 1, 0) end,
      r.min_days, r.max_days, r.is_demo
    from public.shipping_rates r
    where r.active and prefix between r.cep_prefix_start and r.cep_prefix_end
    order by r.base_cents;
end; $$;
grant execute on function public.quote_shipping(text, int, int) to anon, authenticated;

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 100001) unique,
  user_id uuid not null,
  status public.order_status not null default 'awaiting_payment',
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method not null,
  payment_provider text,
  payment_provider_ref text,
  payment_details jsonb,
  subtotal_cents int not null,
  shipping_cents int not null,
  discount_cents int not null default 0,
  total_cents int not null,
  shipping_service text not null,
  shipping_min_days int,
  shipping_max_days int,
  shipping_address jsonb not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  carrier text,
  tracking_code text,
  tracking_url text,
  admin_notes text,
  paid_at timestamptz,
  stock_committed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);
create index orders_created_idx on public.orders(created_at desc);
grant select on public.orders to authenticated;
grant update (status, carrier, tracking_code, tracking_url, admin_notes) on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Owners and admins read orders" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins update orders" on public.orders for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  image text,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Owners and admins read items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status,
  title text not null,
  description text,
  location text,
  source text not null default 'admin' check (source in ('system','admin','payment_provider','carrier')),
  occurred_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index tracking_events_order_idx on public.tracking_events(order_id, occurred_at desc);
grant select, insert on public.tracking_events to authenticated;
grant all on public.tracking_events to service_role;
alter table public.tracking_events enable row level security;
create policy "Owners and admins read events" on public.tracking_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));
create policy "Admins add manual events" on public.tracking_events for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and source = 'admin');

create or replace function public.orders_status_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('payment_approved','preparing','shipped','out_for_delivery','delivered')
       and new.payment_status <> 'approved' then
      raise exception 'O pagamento deste pedido ainda não foi confirmado pelo provedor';
    end if;
    if new.status = 'awaiting_payment' then
      raise exception 'Não é possível voltar o pedido para aguardando pagamento';
    end if;
    if new.status in ('shipped','out_for_delivery','delivered')
       and (coalesce(new.tracking_code,'') = '' or coalesce(new.carrier,'') = '') then
      raise exception 'Informe a transportadora e o código de rastreamento antes de marcar como enviado';
    end if;
    if old.status in ('delivered','canceled') then
      raise exception 'Pedidos entregues ou cancelados não podem mudar de status';
    end if;
    if new.status = 'canceled' and old.stock_committed then
      update public.product_variants v set stock = v.stock + i.quantity
        from public.order_items i where i.order_id = new.id and i.variant_id = v.id;
      new.stock_committed := false;
    end if;
  end if;
  return new;
end; $$;
create trigger orders_status_guard before update on public.orders for each row execute function public.orders_status_guard();

create or replace function public.orders_status_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
declare src text;
begin
  if new.status is distinct from old.status then
    t := case new.status
      when 'payment_approved' then 'Pagamento aprovado'
      when 'preparing' then 'Pedido em preparação'
      when 'shipped' then 'Pedido enviado'
      when 'out_for_delivery' then 'Saiu para entrega'
      when 'delivered' then 'Pedido entregue'
      when 'canceled' then 'Pedido cancelado'
      else 'Status atualizado' end;
    src := case when new.status = 'payment_approved' then 'payment_provider'
                when auth.uid() is null then 'system' else 'admin' end;
    insert into public.tracking_events (order_id, status, title, description, source, created_by)
    values (new.id, new.status, t,
      case when new.status = 'shipped' then 'Transportadora: ' || new.carrier || ' · Código: ' || new.tracking_code else null end,
      src, auth.uid());
  end if;
  return null;
end; $$;
create trigger orders_status_event after update on public.orders for each row execute function public.orders_status_event();

create or replace function public.create_order(
  _items jsonb, _address jsonb, _payment_method public.payment_method, _shipping_service text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  it jsonb;
  v record;
  qty int;
  subtotal int := 0;
  item_count int := 0;
  ship record;
  oid uuid;
  prof record;
  em text;
begin
  if uid is null then raise exception 'Faça login para finalizar a compra'; end if;
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'Carrinho vazio'; end if;
  if coalesce(_address->>'recipient','') = '' or coalesce(_address->>'cep','') = '' or coalesce(_address->>'street','') = ''
     or coalesce(_address->>'number','') = '' or coalesce(_address->>'district','') = ''
     or coalesce(_address->>'city','') = '' or coalesce(_address->>'state','') = '' then
    raise exception 'Endereço de entrega incompleto';
  end if;

  for it in select * from jsonb_array_elements(_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty < 1 or qty > 99 then raise exception 'Quantidade inválida'; end if;
    select pv.id, pv.name as vname, pv.stock, coalesce(pv.price_cents, p.price_cents) as price, p.name as pname, p.is_active
      into v from public.product_variants pv join public.products p on p.id = pv.product_id
      where pv.id = (it->>'variant_id')::uuid;
    if not found or not v.is_active then raise exception 'Produto indisponível'; end if;
    if v.stock < qty then raise exception 'Estoque insuficiente para %', v.pname; end if;
    subtotal := subtotal + v.price * qty;
    item_count := item_count + qty;
  end loop;

  select * into ship from public.quote_shipping(_address->>'cep', subtotal, item_count) q where q.service = _shipping_service limit 1;
  if not found then raise exception 'Opção de frete indisponível para este CEP'; end if;

  select full_name, phone into prof from public.profiles where id = uid;
  select email into em from auth.users where id = uid;

  insert into public.orders (user_id, payment_method, subtotal_cents, shipping_cents, total_cents,
    shipping_service, shipping_min_days, shipping_max_days, shipping_address, customer_name, customer_email, customer_phone)
  values (uid, _payment_method, subtotal, ship.price_cents, subtotal + ship.price_cents,
    ship.service, ship.min_days, ship.max_days, _address, coalesce(prof.full_name, _address->>'recipient'), em,
    coalesce(prof.phone, _address->>'phone'))
  returning id into oid;

  insert into public.order_items (order_id, product_id, variant_id, product_name, variant_name, image, unit_price_cents, quantity)
  select oid, p.id, pv.id, p.name, pv.name, p.images[1], coalesce(pv.price_cents, p.price_cents), (x->>'quantity')::int
  from jsonb_array_elements(_items) x
  join public.product_variants pv on pv.id = (x->>'variant_id')::uuid
  join public.products p on p.id = pv.product_id;

  insert into public.tracking_events (order_id, status, title, description, source, created_by)
  values (oid, 'awaiting_payment', 'Pedido recebido', 'Aguardando confirmação do pagamento pelo provedor.', 'system', uid);

  return oid;
end; $$;
revoke execute on function public.create_order(jsonb, jsonb, public.payment_method, text) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, public.payment_method, text) to authenticated;

create or replace function public.confirm_payment(_order_id uuid, _provider text, _provider_ref text)
returns void language plpgsql security definer set search_path = public as $$
declare o record;
declare short record;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if o.payment_status = 'approved' then return; end if;
  for short in
    select p.name from public.order_items i join public.product_variants pv on pv.id = i.variant_id
    join public.products p on p.id = pv.product_id where i.order_id = _order_id and pv.stock < i.quantity
  loop
    raise exception 'Estoque insuficiente para % no momento da confirmação', short.name;
  end loop;
  update public.product_variants pv set stock = pv.stock - i.quantity
    from public.order_items i where i.order_id = _order_id and i.variant_id = pv.id;
  update public.products p set sold_count = p.sold_count + s.q
    from (select product_id, sum(quantity) q from public.order_items where order_id = _order_id group by product_id) s
    where s.product_id = p.id;
  update public.orders set payment_status = 'approved', payment_provider = _provider, payment_provider_ref = _provider_ref,
    paid_at = now(), stock_committed = true, status = 'payment_approved'
    where id = _order_id;
end; $$;
revoke execute on function public.confirm_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, text, text) to service_role;

-- ============ DEMO SEED (clearly marked is_demo) ============
insert into public.categories (slug, name, description, icon, sort_order) values
  ('eletronicos', 'Eletrônicos', 'Fones, smartwatches e áudio', 'Headphones', 1),
  ('casa-e-cozinha', 'Casa e Cozinha', 'Utilidades para o dia a dia', 'CookingPot', 2),
  ('moda', 'Moda', 'Calçados, mochilas e acessórios', 'Shirt', 3),
  ('beleza', 'Beleza', 'Cuidados pessoais e skincare', 'Sparkles', 4),
  ('esportes', 'Esportes', 'Treino, corrida e bem-estar', 'Dumbbell', 5),
  ('ferramentas', 'Ferramentas', 'Kits e equipamentos', 'Wrench', 6);

insert into public.products (slug, name, description, brand, category_id, price_cents, compare_at_cents, images, is_featured, is_new, is_demo, sold_count)
select v.slug, v.name, v.description, v.brand, c.id, v.price, v.compare, array['/images/products/' || v.slug || '.jpg'], v.featured, v.is_new, true, v.sold
from (values
  ('fone-bluetooth-pulse','Fone de Ouvido Bluetooth Pulse ANC','[Produto demonstrativo] Fone over-ear com cancelamento ativo de ruído, até 30h de bateria e carregamento rápido via USB-C.','Pulse','eletronicos',24990,34990,true,false,320),
  ('smartwatch-orbit','Smartwatch Orbit Fit','[Produto demonstrativo] Tela AMOLED de 1,4", monitor cardíaco, GPS integrado e resistência à água 5ATM.','Orbit','eletronicos',39990,59990,true,true,210),
  ('caixa-som-wave','Caixa de Som Portátil Wave','[Produto demonstrativo] Som 360°, proteção IPX7 e 12h de reprodução contínua.','Wave','eletronicos',18990,null,false,true,95),
  ('air-fryer-cris','Air Fryer Cris 4L','[Produto demonstrativo] Fritadeira sem óleo com cesto antiaderente de 4 litros e 8 programas automáticos.','Cris','casa-e-cozinha',37990,49990,true,false,540),
  ('jogo-panelas-terra','Jogo de Panelas Antiaderente Terra 5 peças','[Produto demonstrativo] Revestimento cerâmico, cabos ergonômicos e compatível com indução.','Terra','casa-e-cozinha',45990,null,false,false,130),
  ('luminaria-led-halo','Luminária de Mesa LED Halo','[Produto demonstrativo] 3 temperaturas de cor, ajuste de intensidade por toque e haste articulada.','Halo','casa-e-cozinha',15990,19990,false,true,60),
  ('tenis-corrida-flux','Tênis de Corrida Flux','[Produto demonstrativo] Entressola com amortecimento responsivo e cabedal em malha respirável.','Flux','moda',29990,39990,true,true,410),
  ('mochila-urbana-nomad','Mochila Urbana Nomad 25L','[Produto demonstrativo] Compartimento acolchoado para notebook de 15,6", tecido impermeável e alças ajustáveis.','Nomad','moda',21990,null,false,false,180),
  ('kit-skincare-glow','Kit Skincare Glow 3 Passos','[Produto demonstrativo] Limpeza, sérum de vitamina C e hidratante facial para rotina diária.','Glow','beleza',12990,16990,true,false,620),
  ('garrafa-termica-trail','Garrafa Térmica Trail 1L','[Produto demonstrativo] Aço inox de parede dupla: 24h gelado e 12h quente.','Trail','esportes',9990,null,false,true,275),
  ('tapete-yoga-flow','Tapete de Yoga Flow','[Produto demonstrativo] 6 mm de espessura, superfície antiderrapante e alça para transporte.','Flow','esportes',14990,18990,false,false,150),
  ('kit-ferramentas-pro','Kit de Ferramentas Pro 110 Peças','[Produto demonstrativo] Maleta rígida com chaves, soquetes, alicates e bits para uso doméstico.','Pro','ferramentas',27990,34990,true,false,88)
) as v(slug, name, description, brand, cat, price, compare, featured, is_new, sold)
join public.categories c on c.slug = v.cat;

insert into public.product_variants (product_id, name, sku, stock, sort_order)
select p.id, v.vname, upper(replace(p.slug,'-','')) || '-' || v.ord, v.stock, v.ord
from (values
  ('fone-bluetooth-pulse','Preto',1,25),('fone-bluetooth-pulse','Branco',2,12),
  ('smartwatch-orbit','Preto',1,18),('smartwatch-orbit','Grafite',2,0),
  ('caixa-som-wave','Azul',1,30),('caixa-som-wave','Preto',2,22),
  ('air-fryer-cris','127V',1,15),('air-fryer-cris','220V',2,9),
  ('jogo-panelas-terra','Padrão',1,10),
  ('luminaria-led-halo','Branco',1,20),('luminaria-led-halo','Preto',2,14),
  ('tenis-corrida-flux','38',1,6),('tenis-corrida-flux','39',2,8),('tenis-corrida-flux','40',3,10),('tenis-corrida-flux','41',4,7),('tenis-corrida-flux','42',5,0),('tenis-corrida-flux','43',6,4),
  ('mochila-urbana-nomad','Preto',1,16),('mochila-urbana-nomad','Verde oliva',2,8),
  ('kit-skincare-glow','Padrão',1,40),
  ('garrafa-termica-trail','Laranja',1,35),('garrafa-termica-trail','Preto',2,28),
  ('tapete-yoga-flow','Areia',1,12),('tapete-yoga-flow','Cinza',2,9),
  ('kit-ferramentas-pro','Padrão',1,3)
) as v(slug, vname, ord, stock)
join public.products p on p.slug = v.slug;

insert into public.shipping_rates (service, cep_prefix_start, cep_prefix_end, base_cents, per_item_cents, min_days, max_days, free_over_cents) values
  ('Econômico', 1, 39, 1490, 300, 4, 7, 19900),
  ('Expresso', 1, 39, 2690, 400, 1, 3, null),
  ('Econômico', 80, 99, 1990, 400, 5, 9, 24900),
  ('Expresso', 80, 99, 3490, 500, 2, 4, null),
  ('Econômico', 40, 79, 2490, 500, 7, 14, 29900),
  ('Expresso', 40, 79, 4290, 600, 3, 6, null);
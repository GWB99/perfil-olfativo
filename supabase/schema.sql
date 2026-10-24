-- =====================================================================
-- Perfil Olfativo · schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
-- Depois rode seed.sql para carregar o catálogo.
-- =====================================================================

-- ---------- configurações do site (linha única) ----------
create table if not exists public.app_settings (
  id            int primary key default 1 check (id = 1),
  private_beta  boolean not null default true,          -- true = só entra quem tem o código de convite
  invite_code   text    not null default 'PERFIL-TESTE',
  admin_emails  text[]  not null default '{guibruno99@gmail.com}',
  free_shipping_over numeric(10,2) not null default 299,
  shipping_fee  numeric(10,2) not null default 19.90,
  updated_at    timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ---------- perfis dos usuários ----------
create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  name              text,
  email             text,
  city              text default 'São Paulo, SP',
  lat               double precision default -23.55,
  lon               double precision default -46.63,
  role              text not null default 'user' check (role in ('user','admin')),
  quiz_answers      jsonb,
  olfactive_profile jsonb,
  quiz_done_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- ---------- catálogo ----------
create table if not exists public.products (
  id         text primary key,
  name       text not null,
  house      text,
  price      numeric(10,2) not null default 0 check (price >= 0),
  stock      int not null default 0 check (stock >= 0),
  volume     text,
  active     boolean not null default true,
  data       jsonb not null default '{}'::jsonb,   -- acordes, notas, estações, ocasiões, performance…
  updated_at timestamptz not null default now()
);

-- ---------- favoritos ----------
create table if not exists public.favorites (
  user_id    uuid references auth.users on delete cascade,
  product_id text references public.products on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- pedidos ----------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete set null,
  status           text not null default 'aguardando_pagamento'
                   check (status in ('aguardando_pagamento','pago','enviado','entregue','cancelado')),
  items            jsonb not null,
  subtotal         numeric(10,2) not null,
  shipping         numeric(10,2) not null,
  total            numeric(10,2) not null,
  shipping_address jsonb,
  payment_provider text default 'simulado',
  payment_id       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- o formulário de cadastro só precisa saber se o convite é exigido
create or replace function public.beta_status() returns boolean
language sql stable security definer set search_path = public as $$
  select private_beta from public.app_settings where id = 1;
$$;
grant execute on function public.beta_status() to anon, authenticated;

-- regras públicas usadas pela loja (frete)
create or replace function public.public_settings() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('private_beta', private_beta, 'free_shipping_over', free_shipping_over, 'shipping_fee', shipping_fee)
  from public.app_settings where id = 1;
$$;
grant execute on function public.public_settings() to anon, authenticated;

-- ---------- cria o perfil a cada cadastro e aplica o convite ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.app_settings;
begin
  select * into s from public.app_settings where id = 1;
  if lower(new.email) = any (select lower(unnest(s.admin_emails))) then
    insert into public.profiles (id, name, email, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email, 'admin');
    return new;
  end if;
  if s.private_beta and coalesce(new.raw_user_meta_data->>'invite_code','') <> s.invite_code then
    raise exception 'CONVITE_INVALIDO';
  end if;
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- fechar pedido: preço e estoque vêm do banco, nunca do navegador ----------
create or replace function public.place_order(p_items jsonb, p_shipping jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  it jsonb; p public.products; q int;
  lines jsonb := '[]'::jsonb; sub numeric := 0; ship numeric; s public.app_settings; oid uuid;
begin
  if auth.uid() is null then raise exception 'LOGIN_NECESSARIO'; end if;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then raise exception 'CARRINHO_VAZIO'; end if;
  select * into s from public.app_settings where id = 1;
  for it in select * from jsonb_array_elements(p_items) loop
    q := greatest(1, least(10, coalesce((it->>'qty')::int, 1)));
    select * into p from public.products where id = it->>'id' and active for update;
    if not found then raise exception 'PRODUTO_INDISPONIVEL:%', it->>'id'; end if;
    if p.stock < q then raise exception 'SEM_ESTOQUE:%', p.name; end if;
    update public.products set stock = stock - q, updated_at = now() where id = p.id;
    lines := lines || jsonb_build_object('id',p.id,'name',p.name,'house',p.house,'price',p.price,'qty',q,'volume',p.volume);
    sub := sub + p.price * q;
  end loop;
  ship := case when sub >= s.free_shipping_over then 0 else s.shipping_fee end;
  insert into public.orders (user_id, items, subtotal, shipping, total, shipping_address)
  values (auth.uid(), lines, sub, ship, sub + ship, p_shipping) returning id into oid;
  return oid;
end $$;
grant execute on function public.place_order(jsonb, jsonb) to authenticated;

-- devolve o estoque quando um pedido é cancelado
create or replace function public.restock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
declare it jsonb;
begin
  if new.status = 'cancelado' and old.status <> 'cancelado' then
    for it in select * from jsonb_array_elements(old.items) loop
      update public.products set stock = stock + (it->>'qty')::int where id = it->>'id';
    end loop;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock before update on public.orders
for each row execute function public.restock_on_cancel();

-- ---------- segurança (RLS) ----------
alter table public.app_settings enable row level security;
alter table public.profiles     enable row level security;
alter table public.products     enable row level security;
alter table public.favorites    enable row level security;
alter table public.orders       enable row level security;

drop policy if exists settings_admin on public.app_settings;
create policy settings_admin on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());
-- o usuário não consegue mudar o próprio "role"
revoke update on public.profiles from authenticated;
grant update (name, city, lat, lon, quiz_answers, olfactive_profile, quiz_done_at) on public.profiles to authenticated;

drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (active or public.is_admin());
drop policy if exists products_admin on public.products;
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for update using (public.is_admin()) with check (public.is_admin());
-- pedidos só são criados pela função place_order

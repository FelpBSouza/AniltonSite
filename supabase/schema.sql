-- Anilton Batista: database foundation for Supabase.
-- Run this migration in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'awaiting_payment', 'paid', 'fulfilled', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  location text,
  event_date date,
  category text not null check (length(trim(category)) between 1 and 40),
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  title text,
  storage_path text not null unique,
  preview_path text,
  price numeric(10,2) not null check (price >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending',
  total numeric(10,2) not null default 0 check (total >= 0),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, photo_id)
);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique,
  note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger albums_set_updated_at
before update on public.albums
for each row execute procedure public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

create or replace function public.set_order_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select price into new.unit_price
  from public.photos
  where id = new.photo_id and is_published = true;

  if new.unit_price is null then
    raise exception 'Photo is not available for purchase';
  end if;

  return new;
end;
$$;

create trigger order_items_set_price
before insert on public.order_items
for each row execute procedure public.set_order_item_price();

create or replace function public.refresh_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set total = coalesce((
    select sum(unit_price) from public.order_items where order_id = coalesce(new.order_id, old.order_id)
  ), 0)
  where id = coalesce(new.order_id, old.order_id);
  return coalesce(new, old);
end;
$$;

create trigger order_items_refresh_total
after insert or update or delete on public.order_items
for each row execute procedure public.refresh_order_total();

alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;

create policy "Users can read their profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Published albums are public"
on public.albums for select
to anon, authenticated
using (is_published = true or public.is_admin());

create policy "Admins manage albums"
on public.albums for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Published photos are public"
on public.photos for select
to anon, authenticated
using (
  public.is_admin()
  or (is_published = true and exists (
    select 1 from public.albums
    where albums.id = photos.album_id and albums.is_published = true
  ))
);

create policy "Admins manage photos"
on public.photos for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users read their orders"
on public.orders for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Users create pending orders"
on public.orders for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

create policy "Admins manage order status"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users read their order items"
on public.order_items for select
 to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);

create policy "Users add items to their pending orders"
on public.order_items for insert
to authenticated
with check (exists (
  select 1 from public.orders
  where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
    and orders.status = 'pending'
));

create policy "Users read their payment proofs"
on public.payment_proofs for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Users submit proofs for their orders"
on public.payment_proofs for insert
to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.orders
  where orders.id = payment_proofs.order_id and orders.user_id = auth.uid()
    and orders.status in ('pending', 'awaiting_payment')
));

create policy "Admins review payment proofs"
on public.payment_proofs for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('photo-originals', 'photo-originals', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "Admins manage original photos"
on storage.objects for all
to authenticated
using (bucket_id = 'photo-originals' and public.is_admin())
with check (bucket_id = 'photo-originals' and public.is_admin());

create policy "Users upload their own payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users read their own payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and ((storage.foldername(name))[1] = (select auth.uid()::text) or public.is_admin())
);

create policy "Users download purchased photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'photo-originals'
  and exists (
    select 1
    from public.order_items
    join public.orders on orders.id = order_items.order_id
    join public.photos on photos.id = order_items.photo_id
    where orders.user_id = auth.uid()
      and orders.status in ('paid', 'fulfilled')
      and photos.storage_path = storage.objects.name
  )
);









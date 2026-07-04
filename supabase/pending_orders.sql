-- Uruchomić ręcznie w Supabase SQL editor (brak systemu migracji w tym repo).
--
-- Przechowuje rezerwacje "w trakcie płatności" pomiędzy utworzeniem sesji
-- Stripe Checkout a potwierdzeniem checkout.session.completed w webhooku.
-- Wiersz w pixel_blocks powstaje dopiero po potwierdzonej płatności — do
-- tego czasu obszar jest "zajęty" tylko poprzez ten wpis w pending_orders.

create table if not exists pending_orders (
  id uuid primary key default gen_random_uuid(),
  x integer not null,
  y integer not null,
  width integer not null,
  height integer not null,
  image_url text not null,
  link_url text,
  owner_name text,
  alt_text text,
  email text not null,
  amount_pln numeric(10, 2) not null,
  stripe_session_id text unique,
  status text not null default 'awaiting_payment',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index if not exists pending_orders_expires_at_idx on pending_orders (expires_at);
create index if not exists pending_orders_status_idx on pending_orders (status);

alter table pending_orders enable row level security;
-- Brak polityk RLS celowo: tabela dostępna wyłącznie przez klienta z
-- SUPABASE_SERVICE_ROLE_KEY (server-side route handlers), nigdy z przeglądarki.

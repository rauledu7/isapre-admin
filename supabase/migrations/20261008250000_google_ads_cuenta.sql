-- Etapa 10: cada asesor guarda su cuenta de Google Ads desde la app.

create table public.google_ads_cuentas (
  asesor_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  developer_token text not null check (char_length(developer_token) between 1 and 200),
  client_id text not null check (char_length(client_id) between 1 and 255),
  client_secret text not null check (char_length(client_secret) between 1 and 255),
  refresh_token text not null check (char_length(refresh_token) between 1 and 512),
  customer_id text not null check (customer_id ~ '^[0-9]{1,20}$'),
  login_customer_id text check (login_customer_id is null or login_customer_id ~ '^[0-9]{1,20}$'),
  conversion_action_id text not null check (conversion_action_id ~ '^[0-9]{1,20}$'),
  currency text not null default 'CLF' check (currency ~ '^[A-Z]{3}$'),
  api_version text not null default 'v21' check (api_version ~ '^v[0-9]{1,3}$'),
  updated_at timestamptz not null default now()
);

create trigger google_ads_cuentas_set_updated_at
before update on public.google_ads_cuentas
for each row execute function public.set_updated_at();

revoke all on public.google_ads_cuentas from anon;
grant select, insert, update on public.google_ads_cuentas to authenticated;

alter table public.google_ads_cuentas enable row level security;

create policy "google_ads_cuentas: solo el asesor dueño"
on public.google_ads_cuentas for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

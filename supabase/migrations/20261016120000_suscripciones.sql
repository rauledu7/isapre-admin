-- Etapa 11: planes de pago y suscripción por asesor, con trial de 7 días al registrarse.
-- El asesor solo lee su suscripción; los cambios los hacen el trigger, los webhooks y el panel admin.

create table public.planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  precio_mensual_clp integer check (precio_mensual_clp > 0),
  precio_trimestral_clp integer check (precio_trimestral_clp > 0),
  precio_anual_clp integer check (precio_anual_clp > 0),
  mp_plan_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger planes_set_updated_at
before update on public.planes
for each row execute function public.set_updated_at();

create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id uuid references public.planes (id) on delete set null,
  periodo text check (periodo in ('mensual', 'trimestral', 'anual')),
  estado text not null check (estado in ('trialing', 'active', 'past_due', 'canceled')),
  fecha_inicio timestamptz not null default now(),
  fecha_fin_trial timestamptz,
  fecha_proximo_pago timestamptz,
  mp_preapproval_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suscripciones_trial_con_fin check (estado <> 'trialing' or fecha_fin_trial is not null)
);

create trigger suscripciones_set_updated_at
before update on public.suscripciones
for each row execute function public.set_updated_at();

create function public.on_auth_user_created_suscripcion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.suscripciones (perfil_id, estado, fecha_inicio, fecha_fin_trial)
  values (new.id, 'trialing', now(), now() + interval '7 days')
  on conflict (perfil_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.on_auth_user_created_suscripcion() from public, anon, authenticated;

create trigger on_auth_user_created_suscripcion
after insert on auth.users
for each row execute function public.on_auth_user_created_suscripcion();

-- Asesores creados antes de esta migración: activos sin vencimiento.
insert into public.suscripciones (perfil_id, estado, fecha_inicio)
select u.id, 'active', now()
from auth.users u
on conflict (perfil_id) do nothing;

revoke all on public.planes, public.suscripciones from anon;
revoke all on public.planes, public.suscripciones from authenticated;
grant select on public.planes, public.suscripciones to authenticated;

alter table public.planes enable row level security;
alter table public.suscripciones enable row level security;

create policy "planes: lectura para asesores"
on public.planes for select to authenticated
using (true);

create policy "suscripciones: el asesor lee la suya"
on public.suscripciones for select to authenticated
using (perfil_id = (select auth.uid()));

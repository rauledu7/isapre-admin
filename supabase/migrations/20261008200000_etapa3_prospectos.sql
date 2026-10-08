-- Etapa 3: embudo de prospectos (etapas editables por asesor), notas y cotizaciones.
-- Cada asesor solo accede a sus propios datos (RLS por asesor_id = auth.uid()).

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.etapas_embudo (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  orden integer not null,
  tipo text not null default 'abierta' check (tipo in ('abierta', 'ganada', 'perdida')),
  created_at timestamptz not null default now(),
  unique (asesor_id, nombre)
);

create index etapas_embudo_asesor_orden_idx on public.etapas_embudo (asesor_id, orden);

create table public.prospectos (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  etapa_id uuid not null references public.etapas_embudo (id) on delete restrict,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  rut text not null check (rut ~ '^[1-9][0-9]{0,7}-[0-9K]$'),
  telefono text not null check (telefono ~ '^\+56[0-9]{9}$'),
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  edad smallint check (edad between 0 and 120),
  renta_imponible_clp bigint check (renta_imponible_clp >= 0),
  isapre_actual text check (
    isapre_actual in ('banmedica', 'consalud', 'colmena', 'cruz-blanca', 'nueva-masvida', 'esencial')
  ),
  cargas jsonb not null default '[]'::jsonb check (jsonb_typeof(cargas) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asesor_id, rut)
);

create index prospectos_asesor_idx on public.prospectos (asesor_id);
create index prospectos_etapa_idx on public.prospectos (etapa_id);

create table public.notas_prospecto (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prospecto_id uuid not null references public.prospectos (id) on delete cascade,
  contenido text not null check (char_length(btrim(contenido)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index notas_prospecto_prospecto_idx on public.notas_prospecto (prospecto_id, created_at desc);

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prospecto_id uuid not null references public.prospectos (id) on delete cascade,
  valor_uf numeric(12, 2) not null check (valor_uf > 0),
  fecha_uf date not null,
  fuente_uf text not null check (fuente_uf in ('mindicador', 'manual')),
  tope_imponible_uf numeric(8, 2) not null check (tope_imponible_uf > 0),
  -- Snapshot de los datos ingresados y del resultado: la cotización no cambia si cambia la UF o la tabla.
  entrada jsonb not null,
  resultado jsonb not null,
  created_at timestamptz not null default now()
);

create index cotizaciones_prospecto_idx on public.cotizaciones (prospecto_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prospectos_set_updated_at
before update on public.prospectos
for each row execute function public.set_updated_at();

create function public.crear_etapas_por_defecto(p_asesor_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.etapas_embudo (asesor_id, nombre, orden, tipo) values
    (p_asesor_id, 'Nuevo', 1, 'abierta'),
    (p_asesor_id, 'Pendiente de reunión', 2, 'abierta'),
    (p_asesor_id, 'No contestó', 3, 'abierta'),
    (p_asesor_id, 'Contactar después', 4, 'abierta'),
    (p_asesor_id, 'Cotizado', 5, 'abierta'),
    (p_asesor_id, 'Pendiente de firma FUN', 6, 'abierta'),
    (p_asesor_id, 'Cerrado (afiliado)', 7, 'ganada'),
    (p_asesor_id, 'Perdido / Descartado', 8, 'perdida')
  on conflict (asesor_id, nombre) do nothing;
$$;

revoke execute on function public.crear_etapas_por_defecto(uuid) from public, anon, authenticated;

create function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.crear_etapas_por_defecto(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_etapas
after insert on auth.users
for each row execute function public.on_auth_user_created();

-- Asesores creados antes de esta migración.
select public.crear_etapas_por_defecto(u.id)
from auth.users u
where not exists (select 1 from public.etapas_embudo e where e.asesor_id = u.id);

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------

revoke all on public.etapas_embudo, public.prospectos, public.notas_prospecto, public.cotizaciones
  from anon;
grant select, insert, update, delete
  on public.etapas_embudo, public.prospectos, public.notas_prospecto, public.cotizaciones
  to authenticated;

alter table public.etapas_embudo enable row level security;
alter table public.prospectos enable row level security;
alter table public.notas_prospecto enable row level security;
alter table public.cotizaciones enable row level security;

create policy "etapas_embudo: solo el asesor dueño"
on public.etapas_embudo for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

create policy "prospectos: solo el asesor dueño"
on public.prospectos for all to authenticated
using (asesor_id = (select auth.uid()))
with check (
  asesor_id = (select auth.uid())
  and exists (
    select 1 from public.etapas_embudo e
    where e.id = prospectos.etapa_id and e.asesor_id = (select auth.uid())
  )
);

create policy "notas_prospecto: solo el asesor dueño"
on public.notas_prospecto for all to authenticated
using (asesor_id = (select auth.uid()))
with check (
  asesor_id = (select auth.uid())
  and exists (
    select 1 from public.prospectos p
    where p.id = notas_prospecto.prospecto_id and p.asesor_id = (select auth.uid())
  )
);

create policy "cotizaciones: solo el asesor dueño"
on public.cotizaciones for all to authenticated
using (asesor_id = (select auth.uid()))
with check (
  asesor_id = (select auth.uid())
  and exists (
    select 1 from public.prospectos p
    where p.id = cotizaciones.prospecto_id and p.asesor_id = (select auth.uid())
  )
);

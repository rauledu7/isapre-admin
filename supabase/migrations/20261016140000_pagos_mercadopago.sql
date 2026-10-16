-- Etapa 12: historial de cobros de Mercado Pago. Lo escribe solo el webhook (service role).
-- Mientras dure la prueba gratis el asesor usa el Full, aunque ya haya contratado otro plan.

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references auth.users (id) on delete cascade,
  mp_invoice_id text not null unique,
  mp_payment_id text unique,
  mp_preapproval_id text not null,
  monto_clp integer check (monto_clp >= 0),
  estado text not null,
  detalle text,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pagos_perfil_idx on public.pagos (perfil_id, fecha desc);

create trigger pagos_set_updated_at
before update on public.pagos
for each row execute function public.set_updated_at();

revoke all on public.pagos from anon;
revoke all on public.pagos from authenticated;
grant select on public.pagos to authenticated;

alter table public.pagos enable row level security;

create policy "pagos: el asesor lee los suyos"
on public.pagos for select to authenticated
using (perfil_id = (select auth.uid()));

create or replace function public.plan_permite(p_funcion text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when s.estado = 'trialing' or s.fecha_fin_trial > now() or p.nivel is null then true
      when p.nivel = 'full' then true
      when p.nivel = 'intermedio' then p_funcion in ('plan_pdf', 'leads_web', 'documentos')
      else false
    end
    from public.suscripciones s
    left join public.planes p on p.id = s.plan_id
    where s.perfil_id = (select auth.uid())
  ), true);
$$;

-- Tarifario común del super admin, y aviso cuando alguien crea una cuenta.

create table public.tarifarios_base (
  isapre_id text primary key check (
    isapre_id in (
      'banmedica',
      'vida-tres',
      'consalud',
      'colmena',
      'cruz-blanca',
      'nueva-masvida',
      'esencial'
    )
  ),
  titulo text,
  planes jsonb not null,
  productos jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger tarifarios_base_set_updated_at
before update on public.tarifarios_base
for each row execute function public.set_updated_at();

revoke all on public.tarifarios_base from anon;
grant select on public.tarifarios_base to authenticated;

alter table public.tarifarios_base enable row level security;

create policy "tarifarios_base: quien cotiza o carga"
on public.tarifarios_base for select to authenticated
using (public.plan_permite('tarifarios') or public.plan_permite('isapres'));

create table public.tarifarios_ocultos (
  asesor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  isapre_id text not null check (
    isapre_id in (
      'banmedica',
      'vida-tres',
      'consalud',
      'colmena',
      'cruz-blanca',
      'nueva-masvida',
      'esencial'
    )
  ),
  primary key (asesor_id, isapre_id)
);

revoke all on public.tarifarios_ocultos from anon;
grant select, insert, update, delete on public.tarifarios_ocultos to authenticated;

alter table public.tarifarios_ocultos enable row level security;

create policy "tarifarios_ocultos: solo el asesor dueño"
on public.tarifarios_ocultos for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

create policy "tarifarios_ocultos: según plan"
on public.tarifarios_ocultos as restrictive for all to authenticated
using (public.plan_permite('tarifarios') or public.plan_permite('isapres'))
with check (public.plan_permite('tarifarios') or public.plan_permite('isapres'));

-- El Full sigue cargando uno nuevo. Quien ya cotiza puede guardar el reemplazo del común.
drop policy "tarifarios: según plan" on public.tarifarios;

create policy "tarifarios: según plan"
on public.tarifarios as restrictive for all to authenticated
using (public.plan_permite('tarifarios') or public.plan_permite('isapres'))
with check (
  public.plan_permite('tarifarios')
  or (
    public.plan_permite('isapres')
    and exists (
      select 1 from public.tarifarios_base b where b.isapre_id = tarifarios.isapre_id
    )
  )
);

alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;

alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('agenda_antes', 'agenda_ahora', 'agenda_dia', 'etapa', 'estancado', 'meta', 'registro'));

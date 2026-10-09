create table public.tarifarios (
  asesor_id uuid not null references auth.users (id) on delete cascade,
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
  titulo text,
  planes jsonb not null,
  productos jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (asesor_id, isapre_id)
);

create trigger tarifarios_set_updated_at
before update on public.tarifarios
for each row execute function public.set_updated_at();

revoke all on public.tarifarios from anon;
grant select, insert, update, delete on public.tarifarios to authenticated;

alter table public.tarifarios enable row level security;

create policy "tarifarios: solo el asesor dueño"
on public.tarifarios for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

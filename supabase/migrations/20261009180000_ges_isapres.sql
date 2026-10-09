create table public.ges_isapres (
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
  ges_uf numeric(8, 4) not null check (ges_uf > 0 and ges_uf < 20),
  updated_at timestamptz not null default now(),
  primary key (asesor_id, isapre_id)
);

create trigger ges_isapres_set_updated_at
before update on public.ges_isapres
for each row execute function public.set_updated_at();

revoke all on public.ges_isapres from anon;
grant select, insert, update, delete on public.ges_isapres to authenticated;

alter table public.ges_isapres enable row level security;

create policy "ges_isapres: solo el asesor dueño"
on public.ges_isapres for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

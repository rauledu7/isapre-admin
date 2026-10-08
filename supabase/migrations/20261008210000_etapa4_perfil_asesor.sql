-- Etapa 4: datos del asesor que aparecen en las propuestas (WhatsApp / PDF).
-- Un perfil por asesor; solo el dueño puede leerlo o modificarlo.

create table public.perfiles_asesor (
  asesor_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  telefono text check (telefono ~ '^\+56[0-9]{9}$'),
  email text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at timestamptz not null default now()
);

create trigger perfiles_asesor_set_updated_at
before update on public.perfiles_asesor
for each row execute function public.set_updated_at();

revoke all on public.perfiles_asesor from anon;
grant select, insert, update on public.perfiles_asesor to authenticated;

alter table public.perfiles_asesor enable row level security;

create policy "perfiles_asesor: solo el asesor dueño"
on public.perfiles_asesor for all to authenticated
using (asesor_id = (select auth.uid()))
with check (asesor_id = (select auth.uid()));

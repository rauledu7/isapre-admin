alter table public.prospectos drop constraint prospectos_isapre_actual_check;

alter table public.prospectos
  add constraint prospectos_isapre_actual_check
  check (
    isapre_actual in (
      'banmedica',
      'vida-tres',
      'consalud',
      'colmena',
      'cruz-blanca',
      'nueva-masvida',
      'esencial'
    )
  );

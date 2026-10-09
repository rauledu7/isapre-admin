import { MARCA, MARCA_ANIO } from "@/config/marca";

/** Aviso de autoría. No afirma registro de marca. */
export function PieLegal({ className }: { className?: string }) {
  return (
    <p className={className}>
      © {MARCA_ANIO} {MARCA}™. Todos los derechos reservados. Queda
      prohibida la reproducción no autorizada de este software y de sus contenidos.
    </p>
  );
}

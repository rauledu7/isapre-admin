"use client";

import { type MouseEvent, type ReactNode } from "react";

let cuadro = 0;

/** Baja hasta el ancla con una curva suave. Un clic nuevo cancela el anterior. */
export function AnclaSuave({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  function ir(evento: MouseEvent<HTMLAnchorElement>) {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
    const nodo = document.querySelector(href);
    if (!(nodo instanceof HTMLElement)) return;
    evento.preventDefault();
    const margen = Number.parseFloat(getComputedStyle(nodo).scrollMarginTop) || 0;
    const destino = nodo.getBoundingClientRect().top + window.scrollY - margen;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(cuadro);
    if (reducido) window.scrollTo(0, destino);
    else cuadro = desplazar(destino);
    history.pushState(null, "", href);
  }

  return (
    <a href={href} onClick={ir} className={className}>
      {children}
    </a>
  );
}

function desplazar(destino: number): number {
  const inicio = window.scrollY;
  const distancia = destino - inicio;
  const duracion = Math.min(980, Math.max(520, Math.abs(distancia) * 0.45));
  const t0 = performance.now();
  const ease = (t: number) => 1 - (1 - t) ** 3;
  const paso = (ahora: number) => {
    const t = Math.min(1, (ahora - t0) / duracion);
    window.scrollTo(0, inicio + distancia * ease(t));
    if (t < 1) cuadro = requestAnimationFrame(paso);
  };
  return requestAnimationFrame(paso);
}

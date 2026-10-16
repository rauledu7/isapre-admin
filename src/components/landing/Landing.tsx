import Image from "next/image";

import { Brand } from "@/components/layout/Brand";
import { PieLegal } from "@/components/layout/PieLegal";
import { cn } from "@/lib/utils";

import { PlanesLanding } from "./PlanesLanding";

const MODULOS = [
  {
    nombre: "Cotizador y comparador",
    puntos: [
      "Partes de la renta, la edad del titular y las cargas.",
      "El 7% legal sale en UF y en pesos, con el tope imponible del año.",
      "Pones el plan vigente al lado de otras alternativas, de la misma Isapre o de otra.",
      "El precio final suma la base por los factores, el GES de cada beneficiario y los productos adicionales.",
      "Cada alternativa queda marcada: deja excedentes o pide cotización adicional.",
      "La UF del día está en el encabezado.",
    ],
  },
  {
    nombre: "Propuesta",
    puntos: [
      "El desglose queda listo para mostrárselo al cliente.",
      "Lo imprimes, copias el texto o lo abres en WhatsApp.",
      "También lo dejas en PDF.",
      "La cotización se guarda en la ficha, junto con las notas y el próximo contacto.",
    ],
  },
  {
    nombre: "Prospectos",
    puntos: [
      "Los ves en un tablero por etapas o en una lista.",
      "Los encuentras por nombre o por RUT, y los creas de a uno o desde un Excel.",
      "La ficha guarda los datos, las notas y el historial de cotizaciones.",
      "Cuando cierras, registras la UF del plan.",
    ],
  },
  {
    nombre: "Calendario y metas",
    puntos: [
      "Anotas una cita con el día, la hora, el nombre y una nota.",
      "Los próximos contactos aparecen en el mismo calendario.",
      "El inicio muestra la meta del mes en UF cerradas y en contratos.",
      "El embudo resume cuántos van en proceso, cuántos cerraste y cuántos se perdieron.",
    ],
  },
  {
    nombre: "Isapres y tarifarios",
    puntos: [
      "Defines el GES de cada Isapre y el cotizador lo usa al armar el precio.",
      "Cargas el PDF de un plan y Velora lee el nombre, el código y el precio.",
      "Cargas los tarifarios y esos planes pasan al cotizador. Banmédica y el resto van en PDF. Nueva Masvida, en Excel.",
    ],
  },
  {
    nombre: "Documentos y campañas",
    puntos: [
      "En la ficha subes la liquidación, la cédula, la AFP, el FUN, las cargas u otros.",
      "Acepta PDF o imagen, hasta 10 MB, con vista previa.",
      "Los leads de tu sitio pueden llegar solos a la app, marcados como web.",
      "Si tienes campañas activas, ves costo, clics, impresiones y conversiones.",
    ],
  },
];

function Vacio({ href, children, compacto = false }: { href: string; children: string; compacto?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/45 bg-transparent text-white transition duration-300 hover:border-white hover:bg-white/10",
        compacto ? "h-9 px-4 text-sm" : "h-11 px-5 text-sm tracking-wide",
      )}
    >
      {children}
    </a>
  );
}

export function Landing({ display }: { display: string }) {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#07080c] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07080c]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 text-white">
          <Brand />
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <a href="#oficio" className="hidden px-2 text-sm text-white/60 hover:text-white md:inline">
              Qué hace
            </a>
            <a href="#planes" className="hidden px-2 text-sm text-white/60 hover:text-white lg:inline">
              Planes
            </a>
            <Vacio href="/login" compacto>
              Entrar
            </Vacio>
            <Vacio href="/registro" compacto>
              Probar 7 días
            </Vacio>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden">
          <Image
            src="/landing/tarde.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="landing-aliento object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,12,0.25)_0%,rgba(7,8,12,0.45)_42%,#07080c_100%)]" />
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 pt-24 pb-16 lg:pb-24">
            <p className="landing-subir text-xs tracking-[0.28em] text-white/70 uppercase">Para quien vende planes de Isapre</p>
            <h1 className={cn(display, "landing-subir max-w-5xl text-5xl leading-[0.92] font-medium tracking-tight text-balance sm:text-7xl lg:text-8xl")} style={{ animationDelay: "80ms" }}>
              Llega a la reunión con el precio final.
            </h1>
            <p className="landing-subir max-w-xl text-lg leading-relaxed text-white/80" style={{ animationDelay: "160ms" }}>
              El cotizador arma el precio en UF y lo compara con el plan actual. El prospecto, el calendario y la propuesta quedan en el mismo escritorio.
            </p>
            <div className="landing-subir flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Vacio href="/registro">Probar 7 días</Vacio>
              <Vacio href="#oficio">Qué hace</Vacio>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-white/60">
              Siete días con el escritorio completo. Si contratas durante la prueba, el primer cobro es al día 7.
            </p>
          </div>
        </section>

        <section id="oficio" className="scroll-mt-20 bg-[#f6f4ef] text-[#1c1917]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-20 lg:py-28">
            <div className="flex max-w-2xl flex-col gap-4">
              <p className="text-xs tracking-[0.22em] text-[#3730a3] uppercase">Qué se puede hacer</p>
              <h2 className={cn(display, "text-4xl leading-tight font-medium tracking-tight text-balance sm:text-5xl")}>
                Lo que cabe en el escritorio.
              </h2>
              <p className="text-base leading-relaxed text-[#1c1917]/70">
                El precio, el prospecto y la propuesta viven en la misma cuenta. Calculas en UF mientras la reunión sigue, y el seguimiento queda anotado para después.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {MODULOS.map((modulo) => (
                <article key={modulo.nombre} className="flex flex-col gap-5 rounded-3xl bg-white p-7 shadow-[0_16px_40px_-28px_rgba(28,25,23,0.35)] sm:p-8">
                  <h3 className={cn(display, "text-3xl font-medium")}>{modulo.nombre}</h3>
                  <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-[#1c1917]/75">
                    {modulo.puntos.map((punto) => (
                      <li key={punto}>{punto}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative min-h-[28rem] overflow-hidden">
          <Image src="/landing/ventana.jpg" alt="Una asesora mira Santiago y la cordillera desde la ventana." fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,12,0.78)_0%,rgba(7,8,12,0.28)_58%,rgba(7,8,12,0.15)_100%)]" />
          <div className="relative z-10 flex min-h-[28rem] items-end">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-16">
              <h2 className={cn(display, "max-w-xl text-4xl leading-tight font-medium tracking-tight text-balance text-white sm:text-5xl")}>
                El cliente pregunta el precio. Tú ya lo tienes.
              </h2>
              <p className="max-w-md text-base leading-relaxed text-white/75">
                Edad, cargas y renta. El cotizador devuelve el total en UF y en pesos mientras la reunión sigue.
              </p>
              <Vacio href="/registro">Probar 7 días</Vacio>
            </div>
          </div>
        </section>

        <section id="planes" className="scroll-mt-20 bg-[#f6f4ef] text-[#1c1917]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-20 lg:py-28">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="text-xs tracking-[0.22em] text-[#3730a3] uppercase">Planes</p>
              <h2 className={cn(display, "text-4xl leading-tight font-medium tracking-tight text-[#1c1917]")}>Elige cómo quieres partir.</h2>
              <p className="text-sm leading-relaxed text-[#1c1917]/70">
                Entras a los 7 días de prueba, o dejas un plan elegido desde el primer día. El trimestre sale cerca de un 10% menos que pagar mes a mes. El año, un 20% menos. Los precios están en pesos.
              </p>
            </div>
            <PlanesLanding display={display} />
          </div>
        </section>

        <section>
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-5 py-20">
            <h2 className={cn(display, "max-w-xl text-4xl leading-tight font-medium tracking-tight text-balance text-white sm:text-5xl")}>
              Una semana con el escritorio completo.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-white/70">
              Creas la cuenta y entras. Si ya elegiste un plan, Mercado Pago cobra cuando se cumplen los siete días.
            </p>
            <div className="flex flex-wrap gap-3">
              <Vacio href="/registro">Probar 7 días</Vacio>
              <Vacio href="/login">Entrar</Vacio>
            </div>
          </div>
        </section>
      </main>

      <PieLegal className="px-5 pb-8 text-xs leading-relaxed text-white/40" />
    </div>
  );
}

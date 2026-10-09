import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

import { leerPlanPdf } from "@/lib/planPdf";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const archivo = form?.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Adjunta el PDF del plan." }, { status: 400 });
  }
  if (archivo.size === 0 || archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: "El PDF debe pesar menos de 8 MB." }, { status: 400 });
  }
  if (archivo.type && archivo.type !== "application/pdf") {
    return NextResponse.json({ error: "El archivo tiene que ser un PDF." }, { status: 400 });
  }

  let texto = "";
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await archivo.arrayBuffer()));
    const extraido = await extractText(pdf, { mergePages: true });
    texto = Array.isArray(extraido.text) ? extraido.text.join("\n") : extraido.text;
  } catch {
    return NextResponse.json({ error: "No pude abrir ese PDF." }, { status: 422 });
  }

  const plan = leerPlanPdf(texto);
  if (!plan.nombre && !plan.isapreId && plan.precioBaseUF === null) {
    return NextResponse.json({ error: "No reconocí el plan en ese PDF." }, { status: 422 });
  }
  return NextResponse.json(plan);
}

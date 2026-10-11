import { NextResponse } from "next/server";
import { leer, escribir } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/datos?v=<versión>
 *   Devuelve { version, data }. Si el cliente ya tiene la última versión, data = null (ahorra tráfico).
 */
export async function GET(req: Request) {
  const v = Number(new URL(req.url).searchParams.get("v") || -1);
  const db = await leer();
  return NextResponse.json({ version: db.version, data: db.version > v ? db.data : null });
}

/**
 * PUT /api/datos  body: { data }
 *   Guarda el estado completo (pedidos, usuarios, tiempos, lotes, permisos...).
 *   Política: la última escritura gana. Para varios usuarios simultáneos en producción,
 *   pasar a tablas separadas (ver docs/MEJORAS-v3.md).
 */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object") {
    return NextResponse.json({ error: "Falta data" }, { status: 400 });
  }
  const db = await escribir((d) => {
    d.data = body.data;
  });
  return NextResponse.json({ version: db.version });
}

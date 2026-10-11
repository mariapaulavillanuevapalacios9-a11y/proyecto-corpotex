import { NextResponse } from "next/server";
import { leer, escribir } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Secciones válidas: evita guardar permisos a vistas que no existen. */
const VISTAS = [
  "inicio", "pedidos", "seguimiento", "abast", "plan", "planta", "talleres", "cambios",
  "calidad", "costos", "cliente", "portal", "config", "usuarios",
];
const ROLES = ["ventas", "produccion", "almacen", "gerencia", "calidad", "taller", "cliente"];

/** GET /api/permisos → { perms, userViews } */
export async function GET() {
  const db = await leer();
  const data = db.data || {};
  return NextResponse.json({
    version: db.version,
    perms: data.perms || null,
    userViews: Object.fromEntries((data.users || []).map((u: any) => [u.u, u.views || null])),
  });
}

/**
 * PUT /api/permisos  body: { perms: { roles, dinero }, userViews: { usuario: string[] | null } }
 * Guarda la matriz RBAC configurada por gerencia. Los demás navegadores la reciben
 * en su siguiente consulta (cada 3 s) y la aplican a menú, rutas y componentes.
 *
 * Nota: en producción esta ruta debe verificar en el servidor que quien llama es gerencia
 * (sesión/JWT). En este prototipo la sesión vive en el navegador.
 */
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.perms?.roles) return NextResponse.json({ error: "Faltan permisos" }, { status: 400 });

  // Sanear: solo roles y vistas conocidas; gerencia siempre conserva usuarios y config
  const roles: Record<string, string[]> = {};
  for (const r of ROLES) {
    const v = (body.perms.roles[r] || []).filter((x: string) => VISTAS.includes(x));
    roles[r] = r === "gerencia" ? Array.from(new Set([...v, "usuarios", "config"])) : v;
  }
  const dinero: Record<string, boolean> = {};
  for (const r of ROLES) dinero[r] = r === "gerencia" ? true : !!body.perms.dinero?.[r];

  const db = await escribir((d) => {
    if (!d.data) d.data = {};
    d.data.perms = { roles, dinero };
    for (const u of d.data.users || []) {
      if (body.userViews && u.u in body.userViews) {
        const v = body.userViews[u.u];
        if (Array.isArray(v)) u.views = v.filter((x: string) => VISTAS.includes(x));
        else delete u.views;
      }
    }
  });
  return NextResponse.json({ ok: true, version: db.version });
}

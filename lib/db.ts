import { promises as fs } from "fs";
import path from "path";

/**
 * Base de datos simple en archivo JSON (data/db.json).
 * Guarda todo el estado de la app con un número de versión para que
 * los navegadores sepan cuándo hay cambios (pedidos, permisos, tiempos...).
 *
 * Para producción se reemplaza por Supabase/PostgreSQL (ver docs/MEJORAS-v3.md):
 * la interfaz leer()/escribir() se mantiene igual.
 */
export type Db = { version: number; data: any | null };

const FILE = path.join(process.cwd(), "data", "db.json");
let cola: Promise<unknown> = Promise.resolve(); // serializa escrituras para no pisarlas

export async function leer(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
  } catch {
    return { version: 0, data: null };
  }
}

/** Aplica un cambio al estado y sube la versión. */
export function escribir(cambio: (db: Db) => void): Promise<Db> {
  const tarea = cola.then(async () => {
    const db = await leer();
    cambio(db);
    db.version += 1;
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(db), "utf8");
    return db;
  });
  cola = tarea.catch(() => undefined);
  return tarea;
}

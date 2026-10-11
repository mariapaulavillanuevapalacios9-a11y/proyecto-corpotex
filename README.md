# CORPOTEX (Next.js)

App de producción, abastecimiento y configurador 3D para Grupo DYC (Unicrack School Athletic y Corpotex).

## Cómo ejecutarla

1. Instala Node.js 18 o superior.
2. En esta carpeta:
   ```
   npm install
   copy .env.example .env.local
   ```
3. Abre `.env.local` y pega tu `ANTHROPIC_API_KEY` (solo se usa para "Armar modelo con IA").
4. Arranca:
   ```
   npm run dev
   ```
5. Abre http://localhost:3000 y entra con un usuario de demostración.

## Estructura

| Archivo | Qué hace |
|---|---|
| `app/layout.tsx` | Fuentes y carga de Three.js |
| `app/page.tsx` | Monta la app |
| `app/markup.ts` | HTML del login y del panel |
| `app/globals.css` | Estilos y modo oscuro |
| `public/dyc-app.js` | Lógica: roles, pedidos, visto bueno, abastecimiento, planificación, 3D, precios |
| `app/api/analizar/route.ts` | Envía la foto de referencia a Claude y devuelve modelo, material, color y estampados |

## Antes de usarla con clientes reales

Los datos (pedidos, usuarios, precios) se guardan en el navegador (`localStorage`) y los permisos se revisan en el navegador.
Para producción hay que mover usuarios, pedidos y precios a una base de datos con login real (por ejemplo Supabase o Firebase)
y validar los permisos en el servidor.

## Mejoras v2

Modelo de datos, navegación por rol e implementación: ver docs/MEJORAS.md. Para los correos de alerta configura SMTP_* en .env.local.

## Mejoras v3

Estados, cronómetro por etapa, calidad, talleres, Excel, gráfico de costos y permisos persistentes: ver docs/MEJORAS-v3.md.
Los datos se guardan en data/db.json (se crea solo al usar la app).

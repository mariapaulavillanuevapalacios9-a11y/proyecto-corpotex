# CORPOTEX · Mejoras v3

Evaluación de pedidos, etapas visibles para ventas, cronómetro por pedido, calidad, talleres tercerizados, alertas de demora, Excel, gráfico de costos y permisos guardados en el servidor.

El código está en `public/dyc-app.js`, en el bloque `MEJORAS v3`. La parte de servidor está en `lib/db.ts`, `app/api/datos/route.ts` y `app/api/permisos/route.ts`.

---

## 1. Flujo de datos y estados

### 1.1 Estados del pedido

| Estado interno | Se muestra como | Quién lo pone | Siguiente |
|---|---|---|---|
| `Pendiente VB` | Pendiente VB | Ventas o cliente (pedido nuevo) | Aceptado / Rechazado / Postergado |
| `VB aprobado` | **Aceptado** | Producción: "Aceptar" (o "Aceptar con nueva fecha" si excede la capacidad) | Confirmado (ventas) |
| `Rechazado` | **Rechazado** | Producción, con motivo | Pendiente VB (ventas corrige y reenvía) |
| `Postergado` | **Postergado hasta (fecha)** | Producción, con fecha de nueva evaluación | Pendiente VB ("Evaluar ahora") |
| `Confirmado` | Por iniciar | Ventas | En producción |
| `En producción` | **Nombre de la etapa**: Corte, Sublimado, Estampado / Bordado, Confección, Acabado o Corrección | Producción, al iniciar el cronómetro de una etapa | Calidad |
| `Pausado` | Pausado | Producción (pausa del proyecto completo) | Estado anterior |
| `Calidad` | En revisión de calidad / Con observaciones | Producción (Finalizar) | Listo despacho o En producción (Corrección) |
| `Listo despacho` | Finalizado | Calidad: "Aprobar" | Entregado |
| `Entregado` | Finalizado | Almacén | — |

**Etapa de proceso** (`o.etapa`): sale de la etapa del cronómetro en curso. Ventas la ve en su Inicio ("Mis pedidos en producción", por ejemplo "Corte · en curso") y como etiqueta junto al estado en la tabla de Pedidos.

### 1.2 Resultado de calidad (`o.qc`)

| `qc.estado` | Pestaña en Calidad | Efecto | Lo que ve Ventas |
|---|---|---|---|
| (sin revisar) | Por revisar | — | En revisión de calidad |
| `Aprobado` | Aprobados | Pasa a `Listo despacho` | Finalizado |
| `Observado` | Con observaciones (con nota y fallas marcadas) | Sigue en Calidad | Calidad: con observaciones |
| `Rechazado` | Rechazados / en corrección | Vuelve a `En producción` con etapa `Corrección` | Corrección |

Cada cambio guarda el historial (`o.hist`) y envía una notificación a ventas, producción y gerencia.

### 1.3 Diagrama

```
Pendiente VB ─┬─ Aceptar ──► Aceptado ─► Confirmado ─► En producción [Corte → Sublimado → Estampado/Bordado → Confección → Acabado]
              ├─ Rechazar ─► Rechazado ─► (ventas corrige) ─► Pendiente VB                          │
              └─ Postergar ► Postergado ─► (fecha / "Evaluar ahora") ─► Pendiente VB                  ▼
                                                                         Calidad ─┬─ Aprobar ──► Listo despacho ─► Entregado
                                                                                  ├─ Observar (nota) ─► sigue en Calidad
                                                                                  └─ Rechazar ─► En producción [Corrección] ─► Calidad
```

---

## 2. Modelo de datos

### 2.1 Cronómetro de producción por pedido y etapa

**Cronómetro activo en el pedido (`o.run`)**

```js
{ etapa: "Corte", start, desde, estado: "corriendo" | "pausado",
  oper: segundos operativos acumulados, muerto: segundos de tiempo muerto acumulados,
  pausas: [{ ini, fin, motivo }], by }
```

**Historial (`o.tiempos[]`)**

```js
{ etapa, inicio, fin, oper, muerto, pausas[], estandar, lento, area, by }
```

**Estándares de tiempo (`ESTANDAR`).** Son datos supuestos que se pueden ajustar.

| Etapa | Rendimiento |
|---|---|
| Corte | 3.5 m² en 10 min |
| Sublimado | 2.5 m² en 10 min |
| Estampado / Bordado | 2 m² en 10 min |
| Confección | 0.8 m² en 10 min |
| Acabado | 5 m² en 10 min |
| Corrección | 3 m² en 10 min |

- Área de un pedido = prendas × metros de tela por prenda (de la lista de materiales) × 1.5 m de ancho.
- Tiempo estándar = área ÷ rendimiento.
- Si el tiempo operativo pasa el estándar, la fila se pinta **en rojo** en vivo. Al terminar la etapa se notifica y se envía un correo de "Demora de proceso".

**SQL**

```sql
create type etapa_proceso as enum ('Corte','Sublimado','Estampado / Bordado','Confección','Acabado','Corrección');

create table estandares_etapa (
  etapa etapa_proceso primary key,
  m2_por_minuto numeric(6,3) not null          -- 0.35 = 3.5 m² en 10 min
);

create table tiempos_etapa (
  id bigserial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  etapa etapa_proceso not null,
  usuario_id uuid references usuarios(id),
  inicio timestamptz not null,
  fin timestamptz,
  seg_operativo int not null default 0,       -- tiempo trabajando
  seg_muerto int not null default 0,          -- tiempo en pausa
  area_m2 numeric(10,2),
  seg_estandar int,
  lento boolean generated always as (seg_operativo > seg_estandar) stored
);

create table paradas (
  id bigserial primary key,
  tiempo_id bigint references tiempos_etapa(id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz,
  motivo text
);

-- Productividad por etapa
create view productividad_etapa as
select etapa, count(*) registros, sum(seg_operativo) operativo, sum(seg_muerto) muerto,
       round(100.0*sum(seg_muerto)/nullif(sum(seg_operativo+seg_muerto),0),1) pct_muerto,
       count(*) filter (where lento) lentas
from tiempos_etapa group by etapa;
```

### 2.2 Permisos (RBAC)

En el estado de la app:

```js
D.perms = { roles: { ventas: ["inicio", ...], produccion: [...], ... }, dinero: { gerencia: true, almacen: true, ... } }
D.users[i].views = ["inicio", "talleres"]   // opcional: permisos personalizados de esa persona
```

**SQL**

```sql
create table permisos_rol (
  rol rol not null,
  vista text not null,
  primary key (rol, vista)
);
create table permisos_dinero (rol rol primary key, ve_dinero boolean not null default false);
create table permisos_usuario (                 -- si existe al menos una fila, reemplaza los del rol
  usuario_id uuid references usuarios(id) on delete cascade,
  vista text not null,
  primary key (usuario_id, vista)
);
```

### 2.3 Calidad y talleres tercerizados

```js
o.qc = { estado: "Aprobado" | "Observado" | "Rechazado", nota, t, by }
D.lotes[] = { id, taller, orderId, proceso, cant, hechas, limite, tarifa, estado: "En proceso" | "Terminado" | "Con problema", notas: [{ t, txt, by }] }
```

Un lote se marca **en rojo** si está "Con problema", si venció sin terminar, o si vence en un día o menos con menos del 80 % hecho.

---

## 3. Implementación

### 3.1 Corrección del bug de permisos de gerencia

**Causa.** Los permisos se guardaban solo en `localStorage` del navegador de gerencia. Las demás personas, en otras computadoras, nunca recibían el cambio.

**Solución.**

1. **Backend.**
   - `lib/db.ts` guarda en `data/db.json` con un número de versión. Las escrituras van en cola para no pisarse.
   - `PUT /api/permisos` valida que roles y vistas existan, impide que gerencia se quede sin Usuarios o Precios, y guarda la matriz y los permisos por usuario.
   - `GET/PUT /api/datos` sincroniza el resto del estado.
2. **Frontend.**
   - Cada casilla de la matriz llama a `pushPermisos()`, que hace `PUT /api/permisos` y muestra "Permisos guardados en la base de datos".
   - `initServer()` detecta el servidor. Cada 3 segundos consulta `GET /api/datos?v=<versión>` y, si hay una versión nueva, `aplicarDatosRemotos()` recalcula `acc()`.
   - Si los permisos de la persona conectada cambiaron, se redibujan el menú y la vista. Si perdió acceso a la sección actual, `render()` la saca a su primera sección permitida. Se muestra el aviso "Gerencia actualizó tus permisos".
   - El menú, las rutas (`data-go` verifica `acc()`) y los componentes (montos con `VEDINERO`) leen siempre la matriz vigente.
3. **Sin servidor** (vista publicada en Claude). Funciona entre pestañas del mismo navegador mediante el evento `storage`.

### 3.2 Cronómetro movido a producción

- Se quitó de Abastecimiento. En la vista solo queda la bandeja de correos.
- En **Seguimiento** está la tarjeta "Cronómetro de producción por pedido": elegir la etapa, Iniciar, Pausar (con motivo de parada) / Reanudar y Terminar etapa. El reloj se actualiza cada segundo y la fila se pone roja al superar el estándar.
- Incluye la tabla "Productividad por etapa" (operativo, muerto, % muerto, estándar, etapas lentas) y el historial de tiempos con su resultado.

### 3.3 Otros

| Requisito | Dónde |
|---|---|
| Perfil Calidad (usuario `rosa.calidad`) | `V.calidad`: pestañas Por revisar, Aprobados, Con observaciones y Rechazados / en corrección. Lista de verificación y nota obligatoria si hay observación o rechazo |
| Perfil taller tercerizado (`taller.limanorte`, `taller.comas`) | `V.talleres`: el taller solo ve sus lotes y registra prendas terminadas, estado y nota (se notifica a producción). Producción y gerencia ven todos los lotes y asignan lotes nuevos |
| Excel | `addExcelButtons()` agrega "Descargar Excel" a cada tarjeta con tabla. `exportarTabla()` usa SheetJS (en selects toma la opción elegida). Dentro de Claude pasa por la confirmación de descarga del visor |
| Gráfico de costos (gerencia) | `drawCostChart()`: barras apiladas con Chart.js (materia prima, mano de obra, tercerización, mermas) y tooltip con el total. La tabla queda debajo como vista accesible |

### 3.4 Pendiente para producción real

1. Cambiar `data/db.json` por las tablas SQL de arriba (Supabase). `lib/db.ts` es el único punto que cambia.
2. Validar la sesión en el servidor: login con Supabase Auth o NextAuth, y que `/api/permisos` solo acepte a gerencia.
3. Cambiar la consulta cada 3 segundos por Supabase Realtime.
4. Hoy `PUT /api/datos` guarda todo el estado y la última escritura gana. Con muchos usuarios a la vez conviene guardar por entidad (pedido, lote o tiempo).

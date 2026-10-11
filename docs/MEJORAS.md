# CORPOTEX · Mejoras v2

Pausa de proyectos, prioridades, aprobación por capacidad, notificaciones, correos, seguimiento, cronómetro y permisos (RBAC).

Todo el código está en `public/dyc-app.js`, en el bloque marcado `MEJORAS v2`. El correo sale por `app/api/email/route.ts`.

---

## 1. Modelo de datos

### 1.1 Cómo se guarda hoy

La app guarda todo en un objeto `D`, dentro de `localStorage` (clave `dycflow-v4`). Al cargar, la función `migrar()` agrega los campos nuevos sin borrar pedidos ni usuarios.

**Pedido (`D.orders[]`): campos nuevos**

| Campo | Tipo | Uso |
|---|---|---|
| `est` | texto | Se suma el estado **`Pausado`** a: Pendiente VB, Observado, VB aprobado, Confirmado, En producción, Calidad, Listo despacho, Entregado |
| `prevEst` | texto | Estado al que vuelve cuando se reanuda |
| `pausa` | `{ t, motivo, by }` | Cuándo, por qué y quién pausó |
| `prioridad` | `"Alta" \| "Media" \| "Baja"` | Columna Prioridad. La sugerida sale de la fecha de entrega y luego se puede editar |
| `hist[]` | `{ est, prev, t, by }` | Historial de cada cambio de estado (módulo Seguimiento) |
| `prod[]` | `{ fecha, cant, by }` | Prendas terminadas por día. Se usa para el avance y para validar la capacidad diaria |
| `inicio`, `fin` | marca de tiempo | Primer paso a "En producción" y paso a "Listo despacho" o "Entregado" |
| `fechaOriginal` | fecha | Fecha pactada antes de aprobar con la nueva fecha que da la capacidad |

**Otras colecciones nuevas**

| Colección | Estructura | Uso |
|---|---|---|
| `D.notifs[]` | `{ id, t, msg, roles[], orderId, read: { [usuario]: true } }` | Campana de notificaciones. Se guarda quién leyó cada aviso |
| `D.emails[]` | `{ id, t, to, subject, body, tipo, estado }` | Bandeja de correos enviados. Estado: En cola, Enviado o Sin servidor de correo |
| `D.timer` | `{ act, start, by, limite, alertado }` | Cronómetro en curso |
| `D.timers[]` | `{ act, start, end, secs, by, limite, excedio }` | Historial de tiempos |
| `D.alerted` | `{ "insumo\|fecha": true }` | Evita enviar el mismo correo de reabastecimiento dos veces el mismo día |
| `D.perms` | `{ roles: { rol: [vistas] }, dinero: { rol: bool } }` | Permisos editables por gerencia (RBAC) |
| `user.views` | `[vistas]` u omitido | Permisos personalizados de un usuario. Si no existe, usa los de su rol |
| `D.cfg.capDia` | número | Capacidad máxima de producción por día (prendas) |
| `D.cfg.emailCompras`, `emailProduccion`, `emailGerencia` | correo | Destinatarios de las alertas |

### 1.2 Esquema SQL para pasar a base de datos (Supabase o PostgreSQL)

```sql
create type estado_pedido as enum (
  'Pendiente VB','Observado','VB aprobado','Confirmado','En producción',
  'Calidad','Listo despacho','Entregado','Pausado'
);
create type prioridad as enum ('Alta','Media','Baja');
create type rol as enum ('ventas','produccion','almacen','gerencia','cliente');

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text unique not null,
  nombre text not null,
  rol rol not null,
  institucion text,
  activo boolean default true,
  vistas text[]              -- null = usa los permisos de su rol
);

create table permisos_rol (
  rol rol primary key,
  vistas text[] not null,
  ve_dinero boolean default false
);

create table pedidos (
  id serial primary key,
  cliente text not null,
  marca text,
  producto text not null,
  cantidad int not null check (cantidad > 0),
  fecha_pactada date not null,
  fecha_original date,
  estado estado_pedido not null default 'Pendiente VB',
  estado_previo estado_pedido,
  prioridad prioridad not null default 'Media',
  pausa_motivo text,
  pausa_desde timestamptz,
  inicio timestamptz,
  fin timestamptz,
  creado_por uuid references usuarios(id),
  creado_en timestamptz default now()
);

create table pedido_historial (
  id bigserial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  estado estado_pedido not null,
  estado_previo estado_pedido,
  usuario_id uuid references usuarios(id),
  creado_en timestamptz default now()
);

create table produccion_diaria (
  id bigserial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  fecha date not null default current_date,
  cantidad int not null check (cantidad > 0),
  usuario_id uuid references usuarios(id)
);

create table notificaciones (
  id bigserial primary key,
  mensaje text not null,
  roles rol[] not null,
  pedido_id int references pedidos(id),
  creado_en timestamptz default now()
);
create table notificaciones_leidas (
  notificacion_id bigint references notificaciones(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  primary key (notificacion_id, usuario_id)
);

create table tiempos_abastecimiento (
  id bigserial primary key,
  actividad text not null,
  usuario_id uuid references usuarios(id),
  inicio timestamptz not null,
  fin timestamptz,
  segundos int,
  limite_min int,
  excedio boolean default false
);

create table correos (
  id bigserial primary key,
  para text not null,
  asunto text not null,
  cuerpo text not null,
  tipo text not null,
  estado text not null default 'En cola',
  creado_en timestamptz default now()
);

create table configuracion (
  clave text primary key,
  valor jsonb not null      -- capDia, correos de alerta, precios, etc.
);
```

**Regla de capacidad en base de datos.** Antes de insertar en `produccion_diaria`, validar:

```sql
select coalesce(sum(cantidad),0) + :nueva <= (select (valor->>'capDia')::int from configuracion where clave='planta')
from produccion_diaria where fecha = current_date;
```

---

## 2. Arquitectura de interfaz y navegación por rol

### 2.1 Componentes globales

| Componente | Función en el código | Qué hace |
|---|---|---|
| Barra lateral | `side()` | Muestra el área del usuario (Ventas, Producción, Almacén y compras, Gerencia) y solo las secciones permitidas por `acc()` |
| Encabezado | `who()` | Campana con el número de avisos sin leer, panel de notificaciones, nombre, rol y cerrar sesión |
| Permisos | `acc()` | Permisos personalizados del usuario, o los de su rol (`D.perms.roles`) |
| Cambio de estado | `onEstado(o, prev)` | Guarda el historial, las fechas de inicio y fin, y notifica a ventas, producción, almacén y gerencia |
| Capacidad | `schedule()`, `estimarFecha()` | Reparte la cola por prioridad, urgencia y puntaje según la capacidad diaria. Da la fecha estimada y las tareas de hoy |
| Correo | `sendEmail()`, `checkStockAlerts()` | Correo de reabastecimiento (uno por insumo por día) y reportes del cronómetro |

### 2.2 Navegación por rol

| Rol | Secciones | Novedades |
|---|---|---|
| **Ventas** | Inicio · Pedidos · Seguimiento (solo lectura) · Planificación · Cambios · Arma tu pedido | Inicio con "Mis pedidos en producción" (por iniciar, iniciado, pausado o finalizado, con avance), sincronizado con producción |
| **Producción** | Inicio · Pedidos · **Seguimiento** · Abastecimiento · Planta · Talleres · Calidad | Sin "Cambios de talla". La planificación pasa a Inicio como **Tareas del día** junto con la cola. Seguimiento registra avance, inicia, finaliza, pausa y reanuda. Cronómetro en Abastecimiento |
| **Almacén y compras** | Inicio · Pedidos · Abastecimiento · Talleres | Subtítulo "Almacén y compras". Sin "Cambios de talla" ni "Calidad y trazabilidad". Ve la bandeja de correos de alerta |
| **Gerencia** | Todo + Precios y parámetros + Usuarios y accesos | Subtítulo "Gerencia". Panel RBAC: permisos por rol, montos de dinero y permisos por usuario. En Precios y parámetros: capacidad diaria y correos de alerta |
| **Cliente** | Arma tu pedido · Seguimiento de pedido | Sin cambios |

### 2.3 Flujo de un pedido

```
Ventas registra ──► Pendiente VB ──► Producción ve el panel de capacidad
                                       ├─ Aprobar (o "Aprobar con nueva fecha" si excede) ─► VB aprobado
                                       └─ Desaprobar ─► Observado ─► Ventas corrige y reenvía
VB aprobado ─► Ventas confirma ─► Confirmado ─► Iniciar ─► En producción ─► Finalizar ─► Calidad ─► Listo despacho ─► Entregado
                     cualquiera de estos ◄──► Pausado (con motivo, libera capacidad)
Cada cambio ─► historial + notificación (campana) a ventas, producción, almacén y gerencia
```

---

## 3. Implementación

### 3.1 Frontend (`public/dyc-app.js`)

1. **Pausar proyecto.** En `detalle(o)`, para los estados de `PAUSABLE` aparece "Pausar proyecto" con un motivo. La acción `pause` guarda `prevEst` y `pausa`, y pone el estado en `Pausado`. `resume` devuelve el estado previo. La columna ESTADO lo muestra con una pastilla roja.
2. **Columna Prioridad.** `prioCell(o)` dibuja un selector Alta, Media o Baja junto a ESTADO, editable por ventas, producción y gerencia. Cada cambio se notifica.
3. **Aprobación por capacidad.** `capacidadHTML()` muestra la carga de hoy y la fecha estimada del pedido. Si pasa la fecha pactada, el botón se vuelve "Aprobar con nueva fecha (…)" y esa fecha queda como comprometida (se guarda `fechaOriginal`). "Desaprobar" devuelve el pedido a ventas.
4. **Límite diario.** `D.cfg.capDia` se configura en Precios y parámetros. Seguimiento no deja registrar más prendas por día que la capacidad.
5. **Notificaciones.** `notify()` desde `onEstado()`, cambios de prioridad, pedidos nuevos, insumos bajo reorden y alertas del cronómetro. Cada usuario marca sus avisos como leídos.
6. **Sincronización ventas ↔ producción.** Todos leen el mismo `D`. El evento `storage` vuelve a dibujar la pantalla al instante cuando otra ventana cambia algo. En producción con base de datos, se reemplaza por Supabase Realtime (ver 3.3).
7. **Cronómetro.** En Abastecimiento: Iniciar / Detener y registrar, con límite opcional en minutos. Un reloj en vivo se actualiza cada segundo. Al pasar el límite, envía notificación y correo. Al detenerse, guarda el tiempo en `D.timers` y envía el reporte.
8. **Correos de reabastecimiento.** `checkStockAlerts()` corre al iniciar sesión y después de cada acción. Por cada insumo bajo el punto de reorden envía un correo a compras y gerencia, una vez por día.
9. **RBAC.** `V.usuarios` tiene la matriz de permisos por rol (casillas), el permiso de ver dinero y los permisos por usuario (de su rol o personalizados). Gerencia no puede quitarse Usuarios ni Precios.

### 3.2 Backend (`app/api/email/route.ts`)

- `POST /api/email` con `{ to, subject, text }`. Envía con nodemailer usando las variables `SMTP_*` de `.env.local`.
- Responde `{ ok: true }` si se envió. Si falta la configuración responde `{ ok: false }` y la app muestra "Sin servidor de correo".

### 3.3 Para producción real (siguiente paso)

1. Crear las tablas de la sección 1.2 en Supabase.
2. Cambiar `save()` y la carga de `D` por llamadas a Supabase, empezando por pedidos, historial, producción diaria, notificaciones y tiempos.
3. Cambiar el evento `storage` por `supabase.channel('pedidos').on('postgres_changes', …)` para tiempo real entre computadoras.
4. Mover la validación de permisos y de capacidad al servidor, con políticas RLS por rol y la consulta de capacidad de la sección 1.2.
5. Programar `checkStockAlerts` como una tarea diaria (cron de Vercel o de Supabase) para que el correo salga aunque nadie abra la app.

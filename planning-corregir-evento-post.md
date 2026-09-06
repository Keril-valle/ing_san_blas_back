# Planning: Corregir el endpoint POST de creación de eventos

Autor del planning: agente de frontend (revisión del módulo `Eventos`)
Fecha: 5 sep 2026
Repositorio objetivo: `BACKEND/ing_san_blas_back` (NestJS)

## Contexto

Se auditó el endpoint `POST` de creación de eventos contra los criterios de aceptación
de la tarea. Para que la tarea quede 100% completa, faltan corregir **dos puntos**.
El resto de los criterios ya se cumplen (no tocarlos).

## Tarea 1 — Seguridad y autorización (PUNTO 1)

### Problema
El endpoint principal `POST /Evento` está marcado como **público**:

- Archivo: `src/Modules/Eventos/evento.controller.ts`
- Línea 73: `@Public()`
- Línea 75: `//@Roles(Role.ADMIN)` (está comentado)

Resultado: cualquier persona sin credenciales puede crear un evento.
Esto viola el criterio: solo usuarios autenticados con rol **Admin/Párroco**
(`Role.ADMIN`) pueden acceder; sin credenciales → `401 Unauthorized`,
con rol insuficiente → `403 Forbidden`.

### Solución requerida
1. Eliminar el decorador `@Public()` del método `create()`.
2. Activar el decorador `@Roles(Role.ADMIN)` (descomentarlo) en `create()`.

Estado objetivo:
```ts
@Post()
@Roles(Role.ADMIN)
create(@Body() createEventoDto: CreateEventoDto) {
  return this.eventoService.create(createEventoDto);
}
```

### Verificación
- `POST /Evento` sin `Authorization` header → debe responder `401`.
- `POST /Evento` con token de un rol no-ADMIN → debe responder `403`.
- `POST /Evento` con token de ADMIN → debe responder `201` (si el payload es válido).
- NO tocar `@Get('publicos')` (sigue siendo público a propósito).

> Nota: los guards globales (`AuthGuard` + `RolesGuard`) ya existen en
> `src/Auth/auth.module.ts` como `APP_GUARD`, por lo que solo con quitar
> `@Public()` el endpoint pasará a exigir token automáticamente.

## Tarea 2 — Auditoría y trazabilidad (PUNTO 2)

### Problema
La entidad `Evento` **no tiene** columna de fecha de creación
(`created_at`). La tarea exige que se estampe automáticamente la fecha/hora
exacta de creación.

- Archivo: `src/Modules/Eventos/Entities/evento.entity.ts`

### Solución requerida
Agregar una columna de auditoría usando TypeORM. Sugerido:
```ts
import { CreateDateColumn } from 'typeorm';

@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
createdAt: Date;
```

### Verificación
- Insertar un evento y confirmar que el registro en BD tiene `created_at` poblado.
- Como en `app.module.ts` está `synchronize: false`, si el esquema se maneja
  con migraciones, generar/aplicar la migración correspondiente de la columna
  (ver scripts `migration:generate` / `migration:run` en `package.json`).

## Alcance / No tocar
- No modificar la lógica del service (`evento.service.ts`) salvo lo necesario.
- No cambiar el DTO (`create-evento.dto.ts`).
- No tocar rutas, filtros (`GlobalExceptionFilter`) ni guards existentes.
- No implementar el punto 3 (ruta `/api/v1/eventos`) ni el punto 4 (validación
  ISO 8601 estricta) — quedan fuera de este planning.
# Train Together — Trabajo pendiente y decisiones abiertas

> Estado: 2026-09-08
> Billing se mantiene fuera de las etapas actuales y se implementará al final.

## 1. Estado ejecutivo

Train Together cuenta con una base funcional para usuarios individuales, duplas y households. También existe una primera foundation de Coaching:

- `spaces` con tipo `coaching`;
- `space_members`;
- `coach_athlete_relationships`;
- invitaciones Coach → Athlete;
- aceptación/rechazo de invitaciones;
- roster de atletas activos;
- avatar en roster y búsqueda;
- eliminación lógica de atletas;
- snapshot inicial de `strategy_versions`;
- Coach Dashboard inicial.

El último `yarn db:check` validó el esquema principal y los datos actuales:

```text
spaces: 1
space_members: 2
coach_athlete_relationships: 1
space_invitations: 1
```

La base de Coaching aún no debe considerarse completa: faltan permisos granulares, vista privada del atleta, planes Coach y auditoría.

## 2. Implementado recientemente

### Coaching Foundation

- Creación de Coaching Space mediante RPC server-side.
- Owner inicial creado en la misma transacción.
- RLS para Spaces, memberships, relaciones e invitaciones.
- Invitación a usuarios existentes por handle, código TT o nombre.
- Validación server-side de owner/coach autorizado.
- Prevención de invitar al propio usuario.
- Prevención de miembros duplicados.
- Capacidad inicial del espacio validada server-side.
- Aceptación que crea membership `athlete` y relación activa.
- Roster autorizado mediante RPC.
- Avatares en roster y resultados de búsqueda.
- Baja lógica con modal de confirmación.

### Strategy Versions

- Snapshot manual desde Strategy.
- Guarda objetivos nutricionales y días/ejercicios actuales.
- Usa `strategy_versions` y su RLS existente.

### AI

- Se hizo rollback al último punto estable conocido después de regresiones en tool calling.
- Las optimizaciones de TPM/tool loop quedan documentadas en `AI_BACKLOG.md`.
- No reactivar AI Actions avanzadas hasta rediseñar el workflow.

## 3. Trabajo implementado en esta ronda

- RPC seguro `get_coach_athlete_overview` scoped por actor, Space y relación activa.
- `/app/coach/athletes/:spaceId/:athleteId` con overview privado.
- `strategy_management` con modo `self/coach` y manager explícito.
- Activación de gestión de Strategy desde Athlete Overview.
- Matriz inicial de permisos por relación: Strategy, progress, execution, nutrition, notes y athlete management.
- Helper server-side `has_coach_permission` y seed automático al crear relaciones.
- RPC scoped de lectura de Athlete Strategy.
- Editor inicial de objetivos de Strategy para Coach con `strategy_manage`.
- Estado `strategy_management` mostrado en Athlete Overview.
- Strategy draft inicial creado desde la Strategy canónica, con metadata de autor, Space, relación, versión y status.
- Coach Notes privadas y Audit Logs scoped por actor, atleta, Space y relación.
- Custom Exercises modelados como `system`, `private` y `space`, sin media ni moderación.
- Ownership/visibility visible en la biblioteca y contrato de edición privada preparado.
- Comando CI reproducible en `package.json`: `yarn ci`.
- Accesibilidad básica agregada a cards accionables de ejercicios y personas.
- `db:check` ahora valida también Realtime de Coaching; aplicar `20260907300000_health_check_coaching_realtime.sql` antes del próximo check remoto.
- Strategy version metadata y creación de drafts desde la Strategy canónica.
- Publicación atómica de Strategy preparada server-side, pendiente de aplicación y prueba E2E.
- Realtime selectivo preparado para Strategy, management, notes y relaciones Coach/Athlete.
- Capability `coaching_create` server-side y navegación Coaching condicionada.

Las migraciones de esta ronda aún deben aplicarse/verificarse en remoto antes de probar producción.

## 4. Pendientes P0 — Foundation inmediata

### 4.1 Vista privada del atleta

Crear una ruta equivalente a:

```text
/app/coach/athletes/:athleteId
```

Debe mostrar únicamente datos autorizados:

- perfil básico;
- peso y tendencia;
- pasos;
- progreso;
- PRs;
- sesiones recientes;
- volumen;
- adherencia;
- plan actual;
- métricas permitidas.

No reutilizar `PublicProfilePage`. Debe usar RPCs y permisos server-side.

### 3.2 Matriz de permisos

Definir permisos explícitos:

```text
view_profile
view_workouts
edit_workouts
view_workout_history
view_progress
view_metrics
view_prs
view_nutrition
edit_nutrition
view_food_log
view_meal_plan
edit_meal_plan
view_notes
edit_notes
manage_athlete
remove_athlete
```

No depender únicamente de `role === 'coach'`.

### 3.3 Invitaciones completas

Pendiente:

- cancelar invitación como coach;
- expiración visible;
- reenviar invitación;
- historial de invitaciones;
- mensajes diferenciados para capacidad, duplicados y expiración;
- onboarding para atleta sin cuenta.

### 3.4 Strategy Versions completo

Actualmente existe guardado de snapshot. Falta:

- listado de versiones;
- detalle de snapshot;
- comparar versiones;
- restaurar versión;
- `created_by`;
- `effective_from`;
- `effective_until`;
- `change_reason`;
- estados draft/published/active.

## 4. Pendientes P1 — Coaching funcional

### 4.1 Plan de entrenamiento Coach

El coach debe poder seleccionar atleta y:

- crear/editar días;
- agregar/reordenar ejercicios;
- cambiar series, repeticiones, peso y descanso;
- duplicar días y semanas;
- agregar notas;
- guardar draft;
- revisar;
- publicar.

Modelo recomendado:

```text
Draft → Review → Publish → Active plan
```

El atleta debe seguir usando el plan publicado mientras el coach edita un draft.

### 4.2 Nutrición Coach

Permitir al coach:

- ver el plan nutricional autorizado;
- crear un draft;
- editar calorías/macros/fibra;
- asignar recetas y Meal Planner;
- publicar una nueva versión;
- consultar cumplimiento.

No sobrescribir el Food Log real del atleta.

### 4.3 Coach Notes

Crear notas privadas con:

- author;
- space;
- athlete;
- contenido;
- visibilidad;
- created_at;
- updated_at.

### 4.4 Audit Log

Registrar acciones sensibles:

```text
coach_added_athlete
coach_removed_athlete
coach_changed_workout
coach_changed_nutrition
coach_published_plan
athlete_revoked_access
```

## 5. Pendientes P2 — Spaces y privacidad

### 5.1 Compatibility layer

`households` continúa siendo el modelo operativo actual. Falta definir una migración gradual hacia `spaces` sin romper:

- Household;
- Nutrition con `household_id`;
- Grocery List;
- invitaciones actuales;
- RLS existente;
- Realtime.

No renombrar tablas abruptamente.

### 5.2 Múltiples espacios

Completar UX para que el usuario pueda cambiar entre:

```text
Personal
Household
Coaching Space
Future Gym/Team
```

El rol debe depender del Space, nunca ser global.

### 5.3 Privacidad granular

Diseñar permisos separados para:

```text
SELF
HOUSEHOLD
COACH
FOLLOWERS
PUBLIC
```

No reutilizar `profile_visibility` y `progress_visibility` para cubrir todos los escenarios de Coaching.

## 6. Pendientes P3 — User-Generated Content

### 6.1 Custom Exercises

Agregar ownership:

```text
system
user
space
```

Visibilidad:

```text
private
space
public
system
```

### 6.2 Moderación

Flujo:

```text
draft
→ uploaded
→ processing
→ pending_moderation
→ approved/rejected/flagged
→ published
```

### 6.3 Media

Crear media assets para:

- GIF;
- MP4;
- WEBM;
- thumbnails;
- metadata;
- procesamiento;
- moderación.

No guardar solamente URLs libres.

## 7. AI Backlog

El detalle técnico está en `docs/AI_BACKLOG.md`.

Pendiente:

- estabilizar chat read-only con contract tests;
- no reactivar optimizaciones sin medición;
- no depender de loops libres del modelo;
- diseñar workflows deterministas por acción;
- validar schemas contra Groq;
- retomar `create_custom_food` desde el punto estable;
- retomar `log_food`;
- retomar `add_meal_to_plan`;
- retomar `create_workout_draft`;
- agregar idempotencia comprobada;
- diferenciar provider 400, 429 y 5xx;
- agregar tests de provider y herramientas.

## 8. Billing — última etapa

No implementar Billing antes de cerrar Spaces, permisos, ownership y flujo Coach/Athlete.

Pendiente:

- `plans`;
- `billing_customers`;
- `subscriptions`;
- `subscription_items`;
- `subscription_events`;
- `entitlements`;
- athlete seats;
- límites server-side;
- checkout;
- webhooks idempotentes;
- portal;
- upgrades/downgrades;
- bloqueo al exceder capacidad.

Modelo:

```text
Coach
→ Subscription
→ Coaching Space
→ Athlete seats
```

No implementar gates solamente en frontend.

## 9. Producto y plataforma

Pendiente:

- completar Follow states y bandeja;
- email verification/recovery;
- wearables;
- CI/CD formal;
- E2E tests;
- RLS integration tests;
- OAuth regression tests;
- Realtime connection state y refresh selectivo;
- accesibilidad de modales, formularios y navegación por teclado;
- manejo uniforme de errores y estados de carga.

## 10. Orden de trabajo recomendado

```text
1. Aplicar/verificar las migraciones de Coaching pendientes.
2. Vista privada autorizada del atleta.
3. Matriz de permisos explícita.
4. Cancelar/expirar/re-enviar invitaciones.
5. Strategy Versions: listado, comparación y restauración.
6. Coach Notes.
7. Draft/Review/Publish de entrenamiento.
8. Draft/Review/Publish de nutrición.
9. Audit Log.
10. Compatibility layer completa de Spaces/Households.
11. Custom Exercises y moderación.
12. AI Actions rediseñadas.
13. Billing y seats.
```

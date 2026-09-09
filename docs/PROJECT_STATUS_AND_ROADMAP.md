# Train Together — Recuento real y roadmap

> Actualizado: 2026-09-07
> Estado AI estable restaurado al commit `9154a10`.
> Este documento complementa `DOCUMENTACION_TECNICA.md` y la hoja de evolución de Coaches/Athletes.

## 1. Resumen ejecutivo

Train Together tiene una base funcional sólida para uso individual, duo y household. El backend Supabase, RLS, Realtime, nutrición y entrenamiento ya están operativos.

La evolución hacia Coaches, Athletes, Groups y User-Generated Content debe implementarse como una extensión del modelo existente, no como un backend paralelo.

La prioridad inmediata es conectar capacidades ya presentes antes de introducir el modelo multi-space completo.

## 2. Features implementadas

### Producto base

- React/Vite/TypeScript con routing protegido y páginas lazy-loaded.
- Auth con Supabase y Google OAuth.
- Fallback demo/local cuando Supabase no está configurado.
- Internacionalización español/inglés.
- Diseño responsive de escritorio y móvil.
- Dashboard, Profile, Strategy, Live Training, Manual Training, Quick Log, Progress e History.
- Realtime para tablas principales de fitness, nutrición y social/household.

### Fitness

- Días de entrenamiento y ejercicios planificados.
- Templates de 3/4/5 días.
- Reordenamiento y duplicación de días/ejercicios.
- Configuración avanzada de series, repeticiones, peso, descanso y segundos.
- Live Training con estados ready/set/rest/complete.
- Registro manual y rápido.
- Historial de sesiones, volumen, RPE y sensaciones.
- PRs y métricas diarias.
- Biblioteca de 1.324 ejercicios remotos.

### Social y household

- Perfiles públicos, handles y códigos TT.
- Búsqueda de personas.
- Follow requests básicos.
- Households, miembros, invitaciones y permisos RLS.
- Progreso y actividad compartida.
- `couples/couple_members` quedan como legacy.

### Nutrition

- Catálogo global de alimentos con nutrientes, porciones, alias y traducciones.
- Custom Foods privados con ownership, RLS, edición y archivado.
- Recipes e ingredientes.
- Food Log para alimentos y recetas.
- Meal Planner.
- Grocery Lists.
- Nutrition Insights.
- Cálculos deterministas de porciones, recetas, totales diarios y adherencia.

### AI

- Edge Function `ai-assistant` con autenticación JWT.
- Groq server-side.
- Contextos seleccionables.
- Tools read-only de perfil, nutrición, Food Log, entrenamiento, alimentos y ejercicios.
- La optimización de tokens/tool loop provocó regresiones y fue retirada.
- Las acciones avanzadas `log_food`, `add_meal_to_plan` y `create_workout_draft` quedan en backlog junto con sus migraciones no estabilizadas.
- La prueba de `create_custom_food` debe retomarse desde el punto estable antes de volver a ampliar actions.

## 3. Features parciales o pendientes del producto actual

| Área | Estado | Próximo paso |
|---|---|---|
| `strategy_versions` | Snapshot manual conectado desde Strategy | Agregar listado, restauración y versionado de planes |
| Follow | Envío básico de solicitud | Estados, aceptar/rechazar y listado |
| Wearables | No implementado | Integración posterior con permisos y sync |
| Email recovery/verification | No implementado | Configuración Auth y UI |
| CI/CD | No formalizado | Pipeline de lint/test/build/deploy |
| Billing | Foundation conceptual solamente | No implementar UI sin fuente server-side |
| AI Actions | Inestable, rollback aplicado | Rediseñar workflow determinista |

## 4. Requerimientos nuevos de Coaches/Athletes/Groups/UCG

La hoja `Evolución de Train Together hacia Coaches, Atletas, Grupos y Contenido generado por usuarios.md` agrega estas áreas:

### Arquitectura de espacios

- Evolucionar conceptualmente `households` hacia `spaces` o `workspaces`.
- Soportar tipos `duo`, `household`, `coaching` y futuros `gym/team/club/studio`.
- Permitir múltiples espacios por usuario.
- Mantener compatibilidad con households y couples legacy.

### Coaching

- `space_members` con roles y estados.
- `coach_athlete_relationships` explícita.
- Permisos declarativos, no autorización basada solamente en role.
- Ownership del dato siempre en el atleta.
- Coach Dashboard.
- Athlete management.
- Vista privada del atleta. **Implementada localmente; RPC pendiente de aplicar/verificar en remoto.**
- Planes de entrenamiento y nutrición creados por coach.
- Draft → Review → Publish.
- Notas de coaching.
- Audit logs.

### Invitaciones y privacidad

- Invitar usuarios existentes sin duplicar identidad.
- Onboarding para usuarios nuevos.
- Estados pending/accepted/declined/expired/cancelled.
- Revocar y cambiar coach sin borrar datos.
- Niveles de sharing específicos para coach.

### Monetización

- Subscriptions, plans, entitlements, seats, billing customers, events, checkout, webhooks y portal.
- Capacidad validada server-side.
- Un subscription pertenece a un Coaching Space con N athlete seats.

### User-generated content

- Custom exercises con ownership user/space/system.
- Visibilidad private/space/public/system.
- Moderación draft → processing → moderation → published.
- Media assets para GIF/MP4/WEBM, no URLs sueltas.

## 5. Priorización recomendada

### P0 — Bajo riesgo y alto valor

1. Capability layer server-side para `coaching_create` (en preparación local).
2. Agregar listado y restauración de snapshots de `strategy_versions`.
2. Completar estados de Follow request.
3. Agregar pruebas E2E/manuales para permisos y ownership actuales.
4. Formalizar CI local con lint/typecheck/test/build.

### P1 — Foundation Coach sin billing

5. Diseñar `spaces`/compatibility layer sin migrar households abruptamente. **Preparado localmente.**
6. Crear `space_members` con RLS. **Preparado localmente.**
7. Crear `coach_athlete_relationships` con estados. **Preparado localmente.**
8. Crear matriz inicial de permisos read-only. **Contrato local agregado; falta integrar consultas.**
9. Crear invitación Coach → Athlete para usuario existente. **Implementado localmente.**
10. Athlete/Coach privado con acceso autorizado mínimo.

### P2 — Planes y dashboard Coach

11. Versionado real de planes de entrenamiento.
12. Draft/Review/Publish para entrenamiento.
13. Draft/Review/Publish para nutrición.
14. Coach Dashboard basado en datos reales.
15. Audit log de cambios sensibles.

### P3 — Escala comercial y contenido

16. Billing server-side y entitlements.
17. Seat-based limits.
18. Custom exercises privados y por space.
19. Moderación y publicación pública.
20. Media assets.

## 6. Primera implementación de esta etapa

Se implementó `strategy_versions` porque:

- la tabla ya existe;
- RLS ya existe;
- no requiere nuevo modelo de autorización;
- prepara el concepto Draft/Version para Coaches;
- no modifica ownership ni comportamiento de atletas actuales;
- es reversible y testeable.

## 7. AI Backlog

El detalle de la regresión y el rediseño pendiente está en [`AI_BACKLOG.md`](./AI_BACKLOG.md).

No volver a optimizar TPM ni reactivar write tools hasta tener:

- workflow determinista por acción;
- contract tests de provider;
- tool schemas validados contra el modelo;
- respuesta structured/action verificable;
- pruebas de doble click e idempotencia;
- diagnóstico de provider 400/429.

# Train Together — Backlog AI

> Estado actualizado: 2026-09-07
> Punto estable restaurado: commit `9154a10`

## Motivo del rollback

Las optimizaciones de tokens y del tool loop introdujeron regresiones en el flujo de entrenamiento:

- el modelo podía intentar llamar `search_exercises` cuando esa tool ya no estaba dentro del request;
- algunas solicitudes terminaban en `tool_loop_limit`;
- otras devolvían una rutina extensa en texto plano y se truncaban por `max_tokens`;
- Groq rechazaba requests de tool calling con `400 provider_error`;
- el usuario no recibía un draft estructurado de `create_workout_draft`.

Se restauró selectivamente el área AI al último estado estable conocido (`9154a10`). No se revirtió Training, Nutrition, Social ni Household.

## Estado actual estable

- Chat AI escrito disponible mediante Supabase Edge Function.
- Provider Groq configurado server-side.
- Contexto de usuario y tools de lectura disponibles en el punto estable.
- Preview de acciones AI disponible según el punto restaurado.
- No hay voz todavía.
- No debe considerarse habilitado el flujo de creación automática de rutinas hasta rediseñar el tool loop.

## Pendientes de migraciones AI

Estas migraciones nuevas quedaron fuera del rollback funcional y no deben ejecutarse hasta rediseñar y probar el contrato:

- `20260903120000_ai_action_requests.sql`
- `20260903130000_ai_log_food_action.sql`
- `20260903140000_ai_plan_and_workout_actions.sql`

Antes de aplicarlas nuevamente hay que comprobar el historial remoto, porque `supabase migration list` mostró la columna `Remote` vacía para migraciones existentes.

## Próxima implementación recomendada

### 1. Chat read-only estable

- Mantener preguntas de perfil, nutrición y entrenamiento sin write tools.
- Reducir tokens solo después de tener tests de contrato del provider.
- No cambiar `tool_choice` dinámicamente sin una prueba específica contra el modelo elegido.

### 2. Tool calling determinista

Diseñar un flujo explícito por etapas, no un loop genérico:

```text
intent workout
→ search_exercises
→ validar resultados
→ construir draft server-side
→ preview
→ confirmación
```

La selección de ejercicios no debe quedar completamente a criterio de varias rondas del LLM.

### 3. Action executor seguro

Implementar una única acción por vez:

1. `create_custom_food`
2. `log_food`
3. `add_meal_to_plan`
4. `create_workout_draft`

Cada acción debe tener:

- schema versionado;
- validación server-side;
- idempotency key;
- preview;
- confirmación humana;
- resultado confirmado;
- rollback o estado de error visible.

### 4. Optimización de tokens

Reintentar solo con medición:

- registrar tokens input/output por request;
- registrar cantidad de tool calls;
- comparar historial completo vs resumido;
- comparar tools completas vs tools por contexto;
- evitar reducir `max_tokens` antes de asegurar structured output;
- no forzar `tool_choice` si el modelo o endpoint no lo soporta con el formato enviado.

### 5. Conversaciones

Después de estabilizar el chat:

- persistir conversaciones y mensajes;
- aplicar RLS por usuario;
- limitar retención;
- no guardar audio por defecto;
- agregar opción para eliminar historial.

### 6. Voz

Fuera del alcance inmediato:

```text
audio → Groq Whisper → transcript → AI read-only/action flow
```

La respuesta de voz puede quedar inicialmente en `SpeechSynthesis` del navegador para evitar otro proveedor y costo.

## Verificación obligatoria antes de reactivar acciones

- Chat read-only con preguntas simples.
- Búsqueda de alimentos.
- Búsqueda de ejercicios.
- Contexto aislado entre usuarios.
- Request con una sola tool.
- Request con dos tools encadenadas.
- Provider `400` visible con diagnóstico seguro.
- Provider `429` diferenciado de `400`.
- Acción confirmada una sola vez.
- Doble click/retry no duplica datos.

## Nota de despliegue

Después del rollback, volver a desplegar la Edge Function que corresponda al commit estable antes de probar producción. No ejecutar las migraciones AI del listado hasta cerrar el diseño del nuevo executor.

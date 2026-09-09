# Refinamiento trabajo pendiente y decisiones

> **Proyecto:** Train Together  
> **Estado de referencia:** 2026-09-08  
> **Objetivo de este documento:** reemplazar la interpretación ambigua del backlog de Coaching por una especificación de producto, arquitectura, seguridad y ejecución suficientemente precisa para que agentes de desarrollo puedan continuar el trabajo sin reinventar el modelo ni duplicar funcionalidades existentes.
>
> **Restricción explícita:** Billing, precios, checkout, subscriptions, athlete seats y monetización quedan fuera de las etapas inmediatas. La arquitectura debe quedar preparada para que Billing pueda habilitar capacidades en el futuro, pero no debe implementarse todavía.

---

# 0. Instrucción principal para los agentes

Antes de modificar código, asumir como **source of truth**:

1. la documentación técnica actual del proyecto;
2. las migraciones realmente aplicadas;
3. el código existente;
4. este documento como refinamiento de producto y arquitectura para el trabajo pendiente de Coaching.

No volver a diseñar Coaching desde cero.

La foundation ya existe y debe ser evolucionada:

- `spaces`;
- `space_members`;
- `coach_athlete_relationships`;
- `space_invitations`;
- RPCs de creación/invitación/aceptación/roster/remoción;
- `/app/coach`;
- roster de atletas;
- avatars;
- baja lógica;
- snapshot inicial de `strategy_versions`.

La tarea actual consiste en **cerrar correctamente el modelo operativo de Coaching**, integrar Strategy con ese modelo y corregir los pendientes existentes para que respeten una decisión central de producto:

> **Train Together tiene usuarios, no “tipos de usuario” excluyentes.**
>
> Un usuario siempre conserva su experiencia personal. Household y Coaching son capacidades y relaciones adicionales.
>
> Un atleta no entra en un “modo atleta” ni obtiene una segunda aplicación. Sigue utilizando la misma experiencia personal.
>
> Un Coach obtiene una capa administrativa adicional que le permite gestionar determinados datos de Strategy de los atletas autorizados.

---

# 1. Decisión de producto fundamental

## 1.1 No crear tipos globales de usuario

NO introducir un modelo como:

```text
user_type = standard | athlete | coach | family
```

NO introducir:

```text
is_athlete
is_family_user
```

como identidad global.

Un mismo usuario puede simultáneamente:

- entrenar para sí mismo;
- tener un Household;
- pertenecer como miembro a un Household ajeno;
- estar siendo entrenado por un Coach;
- tener habilitada la capacidad de crear su propio Coaching Space;
- administrar atletas;
- pertenecer en el futuro a otros tipos de Space.

Por lo tanto:

```text
Account
≠ Capability
≠ Space Membership
≠ Space Role
≠ Coach/Athlete Relationship
≠ Subscription
```

Estas dimensiones deben permanecer separadas.

---

# 2. Modelo mental definitivo

El sistema debe entenderse así:

```text
USER
│
├── PERSONAL EXPERIENCE
│   ├── Dashboard
│   ├── Strategy
│   ├── Training
│   ├── Nutrition
│   ├── Progress
│   ├── History
│   └── Profile
│
├── OPTIONAL HOUSEHOLD CONTEXT
│   ├── Duo / Family
│   ├── Shared progress
│   └── Shared grocery
│
├── OPTIONAL COACHING RELATIONSHIP AS ATHLETE
│   └── A Coach may manage part of this user's Strategy
│
└── OPTIONAL COACHING MANAGEMENT CAPABILITY
    └── Coaching
        ├── Dashboard
        ├── Athletes
        ├── Athlete detail
        ├── Strategy management
        ├── Progress
        ├── History
        └── Notes
```

El **Personal Experience** nunca desaparece.

Coaching no reemplaza Personal.

Household no reemplaza Personal.

---

# 3. Capacidades de cuenta

## 3.1 Problema

Hoy la aplicación no debe decidir que alguien es Coach únicamente porque:

```text
space_members.role = 'coach'
```

ni porque:

```text
coach_athlete_relationships
```

tenga alguna fila.

Necesitamos separar:

- poder **crear/administrar** un producto;
- pertenecer a un Space;
- ser atleta de alguien;
- tener determinado rol dentro de un Space.

## 3.2 Solución recomendada

Crear una capa de **capabilities** server-side.

Preferir una tabla explícita en lugar de agregar booleanos sueltos a `profiles`.

Nombre sugerido:

```text
user_capabilities
```

Modelo conceptual:

```text
user_capabilities
------------------------------------------------
id
user_id
capability
status
source
granted_at
expires_at nullable
metadata jsonb
created_at
updated_at
```

Capacidades iniciales necesarias:

```text
household_create
coaching_create
```

Opcionalmente, si mejora la semántica:

```text
household_manage
coaching_manage
```

pero no agregar granularidad innecesaria si puede derivarse del ownership y membership.

Estados sugeridos:

```text
active
disabled
revoked
```

`source` debe permitir distinguir cómo fue concedida:

```text
system
admin
migration
future_billing
```

No implementar todavía `future_billing`, pero dejar el contrato listo.

## 3.3 Por qué NO usar solamente flags en `profiles`

Flags como:

```text
can_create_household
can_create_coaching
```

serían aceptables para un prototipo, pero una tabla de capacidades:

- evita ensuciar `profiles`;
- permite auditoría;
- permite expiración futura;
- permite migrar a entitlements sin cambiar toda la UI;
- permite activar/desactivar capacidades sin mutar identidad;
- separa correctamente cuenta de producto.

Si los agentes detectan que una tabla es excesiva para la etapa actual, deberán documentar la razón antes de optar por flags directas.

---

# 4. Reglas de navegación

La navegación debe depender de **capabilities + relaciones reales**, no de un rol global.

## 4.1 Usuario base

Sin capacidades extra ni memberships:

```text
Dashboard
Strategy
Training
Nutrition
Progress
History
Exercises
Profile
```

No mostrar:

```text
Household
Coaching
```

salvo que las reglas siguientes se cumplan.

## 4.2 Household

Mostrar Household cuando:

```text
user has household_create capability
OR
user is an active member of a household
```

Esto es importante.

Una persona invitada a un Household debe poder entrar a Household aunque ella misma no tenga derecho a crear uno, porque necesita acceder a las funciones compartidas que ya existen.

NO confundir:

```text
can create household
```

con:

```text
is member of household
```

## 4.3 Coaching

La pestaña administrativa:

```text
Coaching
```

debe mostrarse únicamente cuando el usuario tenga derecho a **administrar Coaching**.

Regla recomendada:

```text
has active coaching_create capability
AND
owns or manages at least one coaching space
```

Durante la etapa inicial, si la UX permite que el primer acceso a Coaching cree el Space, puede bastar:

```text
has active coaching_create capability
```

## 4.4 Atleta de Coaching

Un usuario que solamente sea atleta de otro Coach:

```text
DOES NOT SEE "Coaching"
```

aunque exista:

```text
space_members.role = 'athlete'
```

y aunque exista una:

```text
coach_athlete_relationship
```

activa.

Ésta es una decisión de producto no negociable para esta fase.

El atleta usa su experiencia personal normal.

---

# 5. Ejemplos de navegación

## Caso A — Usuario estándar

```text
capabilities: none
household memberships: none
coaching memberships: none
```

Navegación:

```text
Personal only
```

## Caso B — Miembro de Household ajeno

```text
household_create = false
active household membership = true
```

Navegación:

```text
Personal
Household
```

## Caso C — Coach

```text
coaching_create = true
owns coaching space = true
```

Navegación:

```text
Personal
Coaching
```

## Caso D — Coach con Household

```text
household membership = true
coaching_create = true
```

Navegación:

```text
Personal
Household
Coaching
```

## Caso E — Atleta de Coach

```text
coaching_create = false
active coach relationship = true
```

Navegación:

```text
Personal only
```

No aparece Coaching.

## Caso F — Usuario que es atleta y Coach

```text
active relationship with Coach X
coaching_create = true
owns Coaching Space Y
```

Navegación:

```text
Personal
Coaching
```

Su Strategy personal puede estar administrada por Coach X, mientras él administra atletas en Space Y.

Estas dos relaciones no deben interferirse.

---

# 6. Household queda fuera del refactor funcional

El flujo Household actual debe preservarse.

NO cambiar el significado de:

- `households`;
- `household_members`;
- `household_invitations`;
- `household_id` en Nutrition;
- Grocery List;
- Recipes compartidas;
- Meal Planner compartido;
- Food Log household;
- Shared Progress.

NO intentar migrar todas estas tablas a `spaces` durante el trabajo inmediato de Coaching.

La compatibility layer `households ↔ spaces` sigue siendo trabajo futuro controlado.

Prioridad actual:

```text
Coaching functional correctness
before
generic Spaces migration
```

---

# 7. Qué es realmente un Coaching Space

Un Coaching Space NO debe convertirse en dueño de los datos fitness de los atletas.

Su función principal es agrupar:

- el owner/coach;
- atletas;
- relaciones;
- invitaciones;
- autorización;
- futura configuración comercial;
- notas de Coaching;
- auditoría.

Conceptualmente:

```text
Coaching Space
│
├── Coach
├── Athlete memberships
├── Coach/Athlete relationships
├── Permissions
├── Invitations
├── Coach Notes
└── Audit
```

NO duplicar dentro del Space:

```text
workout_days
workout_sessions
nutrition_plans
daily_metrics
personal_records
food_logs
```

Esos datos continúan perteneciendo al usuario.

---

# 8. Principio de ownership

## 8.1 El atleta conserva ownership

Los datos de un atleta continúan ligados a:

```text
user_id = athlete_id
```

El Coach no pasa a ser owner.

El Coach recibe:

```text
authorized management access
```

sobre dominios concretos.

## 8.2 Separar OWNERSHIP de MANAGEMENT

Modelo mental:

```text
Athlete
   owns
     ↓
Personal fitness data

Coach
   manages authorized strategy
     ↓
Athlete's personal fitness data
```

Esto permite:

- terminar Coaching sin perder historial;
- cambiar de Coach;
- mantener sesiones antiguas;
- mantener PRs;
- mantener métricas;
- mantener Food Log;
- mantener progreso;
- mantener identidad.

---

# 9. Decisión central: Strategy del atleta

Éste es el núcleo de todo el refinamiento.

## 9.1 El atleta NO tendrá una Strategy separada de Coaching

NO crear:

```text
coach_strategy
athlete_coach_strategy
coaching_workout_days
coach_nutrition_plan
```

La Strategy visible en:

```text
/app/strategy
```

debe continuar siendo la Strategy real del usuario.

Si el Coach administra esa Strategy, el atleta verá allí mismo los datos prescritos.

## 9.2 Ejemplo

Coach A administra Athlete B.

Coach A define:

```text
daily steps: 10,000
calories: 2,300
protein: 180g
Monday: Bench Press 4x8
Wednesday: Squat 4x6
Friday: Deadlift 3x5
```

Athlete B abre:

```text
/app/strategy
```

y ve:

```text
10,000 steps
2,300 calories
180g protein
Monday / Wednesday / Friday plan
```

No necesita:

```text
/app/my-coach/strategy
```

No necesita:

```text
Athlete Mode
```

No necesita cambiar de workspace para ejecutar su plan.

---

# 10. Strategy como “prescripción” vs ejecución

El dominio debe distinguir claramente:

## PRESCRIBED / PLANNED

Lo que se espera que el atleta haga.

Ejemplos:

- daily step goal;
- calories;
- macros;
- workout days;
- planned exercises;
- sets;
- reps;
- target weight;
- target seconds;
- rest;
- planned meals;
- strategy notes.

## ACTUAL / EXECUTED

Lo que realmente ocurrió.

Ejemplos:

- workout sessions;
- exercise sets;
- actual reps;
- actual weight;
- RPE;
- feeling;
- pain;
- session notes;
- Food Log;
- daily body weight;
- steps actually registered;
- real calorie consumption;
- historical metrics.

Regla:

```text
Coach manages prescription.
Athlete records execution.
```

El Coach puede **leer** ejecución autorizada.

El Coach no debe poder reescribir silenciosamente la realidad histórica del atleta.

---

# 11. Campos que el Coach puede administrar

Primera versión funcional del Coaching.

## 11.1 Strategy / Activity Goals

El Coach puede administrar:

```text
daily_step_goal
```

y cualquier otro objetivo de actividad que sea parte explícita de Strategy.

No debe poder modificar mediante esta vía:

- display name;
- username;
- email;
- avatar;
- auth metadata;
- handle;
- public code;
- datos de identidad.

## 11.2 Nutrition Strategy

El Coach puede administrar:

```text
calories
protein
carbs
fats
fiber
nutrition notes
```

## 11.3 Workout Strategy

El Coach puede administrar:

```text
workout days
weekday
name
description
estimated minutes
exercise ordering
exercise selection
sets
target reps
target seconds
target weight
rest seconds
plan notes
```

## 11.4 Meal Planning

En una fase posterior del mismo flujo de Strategy:

- planned meals;
- assigned recipes;
- meal plan structure.

Nunca modificar el Food Log real como parte de esta operación.

---

# 12. Auditoría obligatoria de fuentes duplicadas

Antes de permitir que Coach edite Strategy, inspeccionar el proyecto completo para detectar datos conceptualmente duplicados.

Ejemplo conocido:

```text
profiles.daily_calorie_goal
nutrition_plans.calories
```

No permitir que dos campos distintos queden como fuentes independientes de verdad.

Los agentes deben:

1. localizar todos los reads;
2. localizar todos los writes;
3. decidir cuál será canonical;
4. documentar compatibilidad;
5. sincronizar/deprecar el campo secundario;
6. agregar tests.

Misma revisión para:

- step goals;
- weight;
- strategy snapshots;
- cualquier objetivo duplicado.

No resolver esto escribiendo “ambos campos” desde frontend sin una regla formal.

---

# 13. Management state de Strategy

Necesitamos saber si la Strategy está:

```text
self-managed
```

o:

```text
coach-managed
```

No inferir únicamente por “existe Coach activo”.

Crear un estado explícito o una regla server-side claramente determinística.

Modelo conceptual recomendado:

```text
strategy_management
------------------------------------------------
user_id
management_mode
manager_user_id nullable
space_id nullable
relationship_id nullable
started_at
ended_at nullable
updated_at
```

Valores:

```text
management_mode:
self
coach
```

Alternativamente, si puede derivarse sin ambigüedad de `coach_athlete_relationships`, documentar la derivación exacta.

No permitir múltiples managers activos ambiguos en esta primera versión.

---

# 14. Restricción inicial: un Coach manager principal por Strategy

Aunque la arquitectura pueda soportar multi-coach en el futuro, esta etapa debe ser simple.

Para la Strategy gestionada:

```text
1 athlete
→ 0 or 1 active strategy manager
```

Esto no impide que en el futuro existan:

- nutrition coach;
- strength coach;
- assistant coach.

Pero no implementar esa complejidad ahora.

Si ya existen múltiples relaciones activas posibles, definir cuál relación tiene `strategy_manager = true` o equivalente.

---

# 15. Qué puede editar el atleta cuando tiene Strategy gestionada

## 15.1 Planning fields

Si:

```text
management_mode = coach
```

entonces el atleta NO debe modificar directamente los campos prescritos que el Coach administra.

Mostrar esos controles como:

```text
read-only
```

o:

```text
disabled with explanation
```

Texto UX sugerido:

```text
Managed by your coach
```

No mostrar un error después de permitir editar.

La UI debe comunicar antes de la acción.

## 15.2 Execution fields

El atleta mantiene edición completa de sus acciones reales:

- iniciar entrenamiento;
- completar entrenamiento;
- registrar series;
- registrar actual reps;
- registrar actual weight;
- RPE;
- feeling;
- pain;
- notas personales;
- Food Log;
- pasos realizados;
- body weight;
- métricas reales.

## 15.3 Profile fields

El atleta conserva control sobre:

- nombre;
- avatar;
- idioma;
- datos de identidad;
- preferencias personales;
- visibilidad;
- seguridad;
- cuenta.

---

# 16. Qué ve el atleta en `/app/strategy`

No crear una pantalla paralela.

`StrategyPage` debe poder renderizar:

### Self-managed

```text
Editable Strategy
```

### Coach-managed

```text
Strategy
Managed by <Coach Display Name>
```

Los controles planificados deben estar bloqueados según management.

Debe seguir mostrando:

- objetivos;
- nutrición;
- entrenamiento;
- ejercicios;
- descansos;
- notas compartidas aplicables.

No convertir `StrategyPage` en una vista de Coaching.

Debe seguir sintiéndose como:

```text
My Strategy
```

---

# 17. Coach Strategy Editor

El Coach necesita una interfaz separada porque está administrando a otra persona.

Ruta sugerida:

```text
/app/coach/athletes/:athleteId/strategy
```

o:

```text
/app/coach/athletes/:athleteId
```

con tabs internas.

Esta UI puede reutilizar componentes de Strategy, pero debe tener:

```text
subjectUserId = athleteId
actorUserId = currentCoachId
```

Conceptualmente:

```text
Same domain data
      │
      ├── Athlete StrategyPage
      │     actor = athlete
      │     subject = athlete
      │
      └── Coach Strategy Editor
            actor = coach
            subject = athlete
```

No duplicar lógica de dominio.

---

# 18. Reutilización de componentes

Extraer componentes reutilizables de `StrategyPage` donde corresponda.

Ejemplos:

```text
StrategyGoalsEditor
NutritionStrategyEditor
WorkoutDaysEditor
WorkoutDayCard
WorkoutExerciseEditor
StrategySummary
```

Props conceptuales:

```ts
subjectUserId
mode: 'self' | 'coach'
permissions
readOnly
managementInfo
onSave
```

Evitar:

```ts
if (isCoach) ...
```

repetido por toda la UI.

---

# 19. No extender `FitnessContext` de forma peligrosa

El `FitnessContext` actual fue diseñado alrededor del usuario autenticado.

No empezar a cargar automáticamente:

```text
all athlete data
```

dentro del estado global.

Eso no escala.

Preferir un dominio Coaching separado:

```text
useCoachAthlete(...)
useCoachStrategy(...)
coachRepository / coaching.ts
```

La información de un atleta debe cargarse scoped por:

```text
spaceId
athleteId
relationshipId
```

El estado personal del Coach debe permanecer separado.

---

# 20. Capa de datos para Coaching

Crear o consolidar módulos como:

```text
src/lib/coaching.ts
src/lib/authorization.ts
src/hooks/useCoachAthlete.ts
src/hooks/useCoachStrategy.ts
```

Nombres exactos pueden variar.

Responsabilidades:

### `coaching.ts`

- list athletes;
- get athlete overview;
- get athlete Strategy;
- get athlete progress;
- get invitations;
- invite/cancel/resend;
- notes;
- audit.

### `authorization.ts`

Helpers de presentación/client-side:

```text
canOpenCoaching
canManageAthlete
canViewAthlete
canManageStrategy
canViewProgress
```

Estos helpers NO sustituyen RLS.

---

# 21. RLS es autoridad real

La UI nunca debe ser la única barrera.

Coach A no debe poder modificar Athlete B cambiando manualmente:

```text
athleteId
```

en una URL.

Cada lectura/escritura debe validar server-side:

```text
auth.uid()
→ active space membership
→ correct coaching space
→ active coach/athlete relationship
→ correct manager
→ required permission
→ resource belongs to athlete
```

---

# 22. RPCs para mutaciones del Coach

No abrir policies de UPDATE genéricas sobre todas las tablas para cualquier Coach.

Preferir operaciones explícitas.

RPCs sugeridas:

```text
get_coach_athlete_overview(...)
get_coach_athlete_strategy(...)
save_coach_strategy_draft(...)
publish_coach_strategy(...)
restore_strategy_version(...)
update_coach_managed_goals(...)
```

Si una mutación puede realizarse directamente con RLS sin perder claridad ni atomicidad, documentar por qué.

Para acciones críticas, preferir RPC transaccional.

---

# 23. No permitir update total de `profiles` al Coach

El Coach puede necesitar cambiar:

```text
daily_step_goal
```

pero no por eso debe tener:

```sql
UPDATE profiles
```

general.

Crear una operación específica que únicamente permita los campos estratégicos autorizados.

Ejemplo conceptual:

```text
set_athlete_strategy_goals(
  athlete_id,
  daily_step_goal,
  ...
)
```

La RPC:

1. valida Coach;
2. valida relación;
3. valida management;
4. valida límites;
5. actualiza únicamente fields permitidos;
6. crea audit log;
7. actualiza version/snapshot si corresponde.

---

# 24. Strategy Versions pasa a ser pieza central

`strategy_versions` no debe quedar como botón aislado “Save snapshot”.

Debe evolucionar hacia historial real de Strategy.

Campos requeridos:

```text
id
user_id
created_by
space_id nullable
relationship_id nullable
version_number
status
name
change_reason
effective_from
effective_until
snapshot
created_at
published_at nullable
```

Estados iniciales:

```text
draft
published
archived
```

Si `active` se necesita como estado separado, evitar duplicar:

```text
status = active
```

y:

```text
is_current = true
```

sin una regla clara.

Elegir un único modelo.

---

# 25. Draft → Publish

Objetivo final:

```text
Current published Strategy
        │
        ├── Athlete continues using it
        │
Coach edits draft
        │
        ▼
Draft version
        │
        ▼
Publish
        │
        ▼
New current Strategy
```

No modificar la Strategy activa en cada keystroke del Coach.

Esto es especialmente importante para:

- cambios grandes de rutina;
- reemplazo de semana;
- nutrición;
- deloads;
- mesociclos.

---

# 26. Cómo representar el Draft

Opción recomendada:

```text
strategy_versions.snapshot
```

contiene el draft completo.

El draft NO se aplica todavía a:

```text
profiles strategic goals
nutrition_plans
workout_days
workout_exercises
meal plans
```

Al publicar:

1. validar snapshot;
2. iniciar transacción;
3. guardar versión anterior;
4. aplicar snapshot a canonical live tables;
5. marcar nueva versión published/current;
6. cerrar effective period anterior;
7. crear audit log;
8. devolver Strategy publicada;
9. invalidar caches;
10. Realtime actualiza al atleta.

---

# 27. Publicación atómica

`publish_coach_strategy` debe ser transaccional.

Nunca dejar estado como:

```text
nutrition updated
workouts failed
```

o:

```text
workouts updated
version not marked current
```

Todo o nada.

Si el snapshot es inválido:

```text
reject publish
```

y mantener Strategy activa anterior.

---

# 28. Primera implementación incremental

Si implementar Draft/Publish completo ahora introduce demasiado riesgo, dividir en:

## Etapa A

Coach puede editar y publicar directamente usando RPC atómica.

## Etapa B

Agregar draft persistente.

## Etapa C

Comparación/restauración/version history.

Pero desde Etapa A toda mutación debe generar un version snapshot y audit.

No introducir un flujo temporal que después requiera duplicar toda la lógica.

---

# 29. Coach Workspace

`/app/coach` debe conceptualizarse como una **capa administrativa**, no una aplicación diferente.

Estructura objetivo:

```text
Coaching
├── Dashboard
├── Athletes
│   └── Athlete Detail
│       ├── Overview
│       ├── Strategy
│       ├── Progress
│       ├── History
│       ├── Nutrition / adherence
│       └── Notes
├── Invitations
└── Settings
```

No agregar todavía:

- Billing;
- marketplace;
- team management avanzado;
- assistant coaches;
- public coach profile complejo.

---

# 30. Athlete Detail privado

La ruta:

```text
/app/coach/athletes/:athleteId
```

es una vista privada exclusivamente para el Coach autorizado.

NO reutilizar `PublicProfilePage`.

Debe consultar endpoints/RPCs scoped.

## Overview

Mostrar:

- avatar;
- display name;
- relationship status;
- last workout;
- current streak;
- weekly adherence;
- weekly volume;
- current step goal;
- steps trend;
- body weight trend si está autorizado;
- PR summary;
- current Strategy version;
- last Strategy change.

## Strategy

Abrir editor autorizado.

## Progress

Mostrar datos derivados de sesiones/métricas.

## History

Mostrar sesiones recientes y detalle.

## Nutrition

Mostrar:

- current prescribed nutrition;
- adherence;
- Food Log solamente si la política definida lo permite;
- no confundir plan con consumo.

## Notes

Coach Notes.

---

# 31. Permisos — simplificar primera versión

El backlog anterior proponía demasiados permisos individuales desde el inicio.

No es necesario comenzar con 16 toggles si todavía no existe una UX que los necesite.

Primera matriz recomendada:

```text
strategy_view
strategy_manage

progress_view

execution_view

nutrition_view
nutrition_manage

notes_manage

athlete_manage
```

Esto debe mapear conceptualmente los permisos finos futuros.

No hardcodear:

```ts
role === 'coach'
```

para otorgar todo.

---

# 32. Permisos futuros

La arquitectura debe poder evolucionar a:

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

pero no obligar a construir toda esa UI en el primer milestone.

---

# 33. Default permission set

Al aceptar una invitación de Coaching, crear un set de permisos predeterminado.

Ejemplo:

```text
strategy_view = true
strategy_manage = true
progress_view = true
execution_view = true
nutrition_view = true
nutrition_manage = true
notes_manage = true
athlete_manage = true
```

Si Food Log requiere consentimiento explícito:

```text
food_log_view = false
```

hasta que producto lo defina.

NO asumir automáticamente que “Coach puede ver absolutamente todo”.

---

# 34. Invitaciones

La foundation actual ya permite:

- buscar usuario;
- invitar;
- aceptar;
- rechazar.

Completar:

```text
cancel
expire
resend
history
```

Estados:

```text
pending
accepted
declined
cancelled
expired
```

---

# 35. Reenvío de invitación

No crear múltiples invitaciones pending duplicadas.

`resend` debe:

- validar la invitación existente;
- actualizar expiración o crear nueva revisión controlada;
- registrar audit;
- impedir spam básico.

---

# 36. Capacidad del Space

Aunque Billing esté fuera, `max_members` / capacidad actual debe seguir validándose server-side.

No implementar todavía planes ni seats comerciales.

En esta fase, la capacidad puede provenir de:

- default del Space;
- configuración administrativa;
- seed;
- capability metadata.

Nunca depender únicamente del frontend.

---

# 37. Onboarding de atleta sin cuenta

Diseñar el flujo, aunque puede implementarse después:

```text
Coach creates invite
→ invite token
→ user signs up
→ identity resolved
→ invite displayed
→ user accepts
→ membership + relationship
→ Strategy management activated
```

No crear perfiles “fantasma” editables por el Coach antes de que exista una cuenta real, salvo que se diseñe explícitamente en otra fase.

---

# 38. Coach Notes

Agregar notas de Coaching separadas de notas personales.

Modelo:

```text
coach_notes
------------------------------------------------
id
space_id
relationship_id
coach_user_id
athlete_user_id
visibility
content
created_at
updated_at
deleted_at nullable
```

Visibility inicial:

```text
private
shared
```

`private`:

- visible para Coach;
- NO visible al atleta.

`shared`:

- visible para Coach;
- visible al atleta en una superficie futura definida.

No mezclar Coach Notes con:

- session notes;
- Food Log notes;
- profile notes;
- workout plan notes.

---

# 39. Audit Log

Crear:

```text
audit_logs
```

o dominio específico equivalente.

Campos:

```text
id
actor_user_id
target_user_id nullable
space_id nullable
relationship_id nullable
action
entity_type
entity_id nullable
metadata
created_at
```

Eventos mínimos:

```text
coaching_space_created
athlete_invited
invitation_cancelled
invitation_accepted
invitation_declined
athlete_removed
strategy_management_started
strategy_draft_created
strategy_published
strategy_restored
coach_changed_training
coach_changed_nutrition
coach_changed_goal
permission_changed
relationship_revoked
coach_note_created
coach_note_updated
```

No guardar secretos ni snapshots completos innecesariamente dentro de metadata.

---

# 40. Baja del atleta

La remoción actual es lógica y debe conservarse.

Al remover:

```text
membership inactive/left
relationship ended/revoked
strategy management released
```

NO borrar:

- profile;
- history;
- sessions;
- sets;
- metrics;
- PRs;
- Food Log;
- Strategy history.

El atleta recupera control personal de su Strategy según la regla definida.

---

# 41. Qué pasa con Strategy al terminar Coaching

Decisión requerida y recomendación:

Cuando termina la relación:

```text
last published Strategy remains as athlete's current Strategy
management_mode becomes self
```

Es decir:

- el plan no desaparece;
- el atleta conserva lo que tenía;
- el Coach pierde write/read access;
- el atleta recupera edición.

NO borrar la rutina al terminar Coaching.

---

# 42. Qué pasa si cambia de Coach

Flujo:

```text
Coach A relationship ends
→ Strategy remains
→ Athlete self-managed temporarily
→ Coach B relationship starts
→ Coach B may become new manager
```

Coach B no debe ver notas privadas de Coach A.

El acceso a versiones históricas creadas por Coach A debe definirse con cuidado:

Recomendación inicial:

- el atleta puede conservarlas;
- Coach B NO ve metadata privada de Coach A salvo que explícitamente se decida compartir;
- Coach B trabaja desde current Strategy.

---

# 43. Household + Coaching simultáneos

Ejemplo:

```text
User B
├── Household "Family"
└── Athlete in "Coach A"
```

Coach administra Strategy personal de B.

Household sigue funcionando normalmente.

Esto NO significa que:

```text
Coach A
```

pueda ver automáticamente:

- Grocery del Household;
- otros household members;
- recetas privadas del Household;
- datos del partner.

Y tampoco significa que otros miembros del Household puedan editar la Strategy porque el Coach la gestiona.

Los permisos son independientes.

---

# 44. Coach + Duo simultáneos

Ejemplo:

```text
User A
├── Personal
├── Duo with User C
└── Coaching Space owner
```

Su rol de Coach no debe afectar:

- su propia Strategy;
- su Duo;
- su Grocery;
- su progreso;
- su historial.

Coaching es un nodo adicional.

---

# 45. Atleta + Coach simultáneo

Ejemplo:

```text
User A
├── Athlete of Coach X
└── Coach of Athletes B/C/D
```

Su Strategy personal puede estar gestionada por Coach X.

En `/app/coach`, A administra B/C/D.

No permitir que el código confunda:

```text
currentUser is coach
```

con:

```text
currentUser's personal Strategy is self-managed
```

Son dimensiones distintas.

---

# 46. Realtime

Cuando Coach publica Strategy:

```text
Coach
→ publish
→ DB transaction
→ Realtime
→ Athlete refreshes Strategy
```

No recargar todo el AppState si puede evitarse.

Crear refresh selectivo para:

- Strategy;
- Coaching roster;
- invitations;
- relationship state;
- notes.

---

# 47. Estado local del atleta después de publish

El atleta puede tener `/app/strategy` abierto.

Al recibir cambio:

- invalidar Strategy query/state;
- refrescar canonical data;
- mostrar banner no invasivo:

```text
Your coach updated your Strategy.
```

No perder una sesión Live activa.

No resetear datos de ejecución.

---

# 48. Live Training

Live Training debe seguir consumiendo la Strategy publicada del atleta.

No debe leer drafts del Coach.

Regla:

```text
Live Training
→ current published workout plan only
```

Si Coach publica durante una sesión activa:

Recomendación:

```text
active session keeps its original plan snapshot
```

No cambiar ejercicios/series a mitad de sesión.

La nueva Strategy aplica a próximas sesiones.

Si el modelo actual no snapshottea correctamente la sesión, documentar y corregir el comportamiento.

---

# 49. Historical integrity

Cambios futuros de Strategy NO deben reescribir sesiones ya completadas.

`exercise_sets` ya conserva planned vs actual; mantener ese principio.

Nunca recalcular retrospectivamente una sesión antigua usando la Strategy nueva.

---

# 50. Nutrition execution

Separar:

```text
prescribed nutrition
```

de:

```text
actual Food Log
```

Coach edita:

- calorías objetivo;
- macros;
- fibra;
- Meal Plan si está incluido.

Athlete registra:

- alimentos realmente consumidos;
- recetas consumidas;
- cantidades;
- horarios.

El Coach no debe sobrescribir Food Log como forma de “corregir adherencia”.

---

# 51. Privacy de Food Log

No decidir accidentalmente que todo Coach puede ver Food Log.

Crear una decisión explícita.

Hasta definir UX granular:

Opción conservadora recomendada:

```text
Coach can see nutrition adherence aggregates
but not every Food Log entry
```

salvo permiso explícito.

Si el producto actual requiere detalle, crear permission separada:

```text
food_log_view
```

---

# 52. Strategy UI del atleta

Cuando Coach gestiona:

```text
My Strategy

Managed by Juan Fitness
Last updated: ...
```

En cada bloque administrado:

```text
Calories    2300
Protein     180g
Steps       10000

Managed by your coach
```

No utilizar lenguaje que implique que el atleta perdió ownership de su cuenta.

---

# 53. Strategy UI del Coach

Cabecera:

```text
Maria
Active athlete
Managed by Juan Fitness
Current Strategy v7
```

Acciones:

```text
Edit draft
Publish
Compare
View history
Restore
```

Si todavía no existe draft:

```text
Create draft from current Strategy
```

---

# 54. Compare Strategy Versions

Vista mínima:

```text
Version A vs Version B
```

Comparar:

### Goals

- steps;
- calories;
- macros.

### Training

- days added/removed;
- exercises added/removed;
- sets;
- reps;
- target weight;
- rest.

### Nutrition

- calories;
- macros;
- fiber;
- notes.

No hacer un diff JSON crudo como UX final.

Puede existir un diff técnico interno, pero la UI debe presentar cambios de dominio.

---

# 55. Restore version

Restaurar NO significa editar la fila vieja.

Debe:

```text
old version
→ clone as new draft
→ publish as new version
```

Así el historial permanece inmutable.

Nunca mover el puntero current hacia una versión vieja sin crear un nuevo evento histórico.

---

# 56. Capability management UI

No implementar Billing.

Crear inicialmente una forma administrativa/development de otorgar capacidades.

Puede ser:

- seed;
- SQL migration demo;
- internal admin script;
- service-role script controlado.

NO crear un botón público:

```text
Become a Coach
```

que simplemente se autoasigne `coaching_create`.

La capacidad debe venir de una fuente confiable.

---

# 57. Futuro Billing

Dejar una interfaz clara:

```text
CapabilityResolver
```

Hoy:

```text
source = admin/system
```

Futuro:

```text
source = entitlement
```

La UI no debe saber si la capacidad vino de Stripe, admin o migration.

Sólo pregunta:

```text
hasCapability('coaching_create')
```

---

# 58. No implementar todavía

Mantener fuera del scope inmediato:

- checkout;
- Stripe;
- prices;
- athlete seats comerciales;
- marketplace;
- public Coach directory;
- reviews;
- bookings;
- assistant coaches;
- multi-coach Strategy;
- gym organizations;
- team sports;
- custom exercise moderation;
- media processing;
- AI Actions avanzadas.

Estos elementos permanecen backlog posterior.

---

# 59. Custom Exercises

No bloquear su futuro.

Cuando se implemente:

```text
system
user
space
```

y:

```text
private
space
public
system
```

Pero NO mezclar esta feature con el cierre actual de Strategy Coaching.

Primero hacer Coaching usable.

---

# 60. AI

AI queda desacoplada del milestone.

No utilizar AI para resolver:

- Strategy writes;
- Coach edits;
- permission decisions;
- publish workflow.

Cuando vuelva:

```text
AI must respect same actor/subject/permissions model
```

pero no reactivar Actions en esta etapa.

---

# 61. Schema inspection obligatorio

Antes de crear nuevas migraciones, inspeccionar:

- `spaces`;
- `space_members`;
- `coach_athlete_relationships`;
- `space_invitations`;
- `strategy_versions`;
- RLS;
- RPCs actuales;
- índices;
- unique constraints;
- Realtime publication;
- generated/manual DB types;
- `db:check`.

No crear tablas duplicadas si una estructura actual puede evolucionar.

---

# 62. Migration policy

Todas las modificaciones DB deben:

- ser migraciones nuevas;
- ser incrementales;
- no editar migraciones ya aplicadas;
- mantener rollback conceptual documentado;
- actualizar `db:check`;
- actualizar types;
- actualizar seeds;
- agregar RLS tests.

---

# 63. Tipos Supabase

La documentación reconoce tipos manuales.

Antes de expandir Coaching seriamente:

- evaluar generar types desde Supabase;
- tipar RPC payloads;
- tipar `Database`;
- evitar `any`;
- evitar casts inseguros.

No bloquear todo el milestone si la generación oficial no puede implementarse inmediatamente, pero no aumentar deuda sin control.

---

# 64. Query model

No hacer:

```text
load all profiles
load all sessions
load all metrics
```

para el Coach.

Usar:

```text
listCoachAthletes(spaceId)
getCoachAthleteOverview(athleteId)
getCoachAthleteStrategy(athleteId)
getCoachAthleteProgress(athleteId)
getCoachAthleteHistory(athleteId, page)
```

Paginar histories y listas grandes.

---

# 65. RLS helper functions

Probablemente consolidar:

```text
is_space_member(space_id)
is_space_owner(space_id)
is_active_coach_of(athlete_id, space_id)
can_manage_athlete_strategy(athlete_id, space_id)
```

Evitar recursion RLS.

No confiar en joins desde policies que disparen nuevamente la misma policy.

---

# 66. Tests de autorización obligatorios

Crear tests server-side para:

## Self

```text
Athlete → own Strategy → read ALLOW
Athlete → own execution → write ALLOW
```

## Authorized Coach

```text
Coach → managed Athlete Strategy → read ALLOW
Coach → managed Athlete Strategy → publish ALLOW
Coach → Athlete history → read ALLOW when permitted
```

## Unauthorized Coach

```text
Coach A → Athlete of Coach B → DENY
```

## Random User

```text
User C → Athlete B Strategy → DENY
```

## Revoked Relationship

```text
Former Coach → Strategy → DENY
```

## Removed Membership

```text
Removed Coach/Athlete link → DENY
```

## Athlete planning lock

Si Strategy está coach-managed:

```text
Athlete → direct prohibited planning mutation → DENY or controlled RPC rejection
```

## Execution remains writable

```text
Athlete → record set → ALLOW
Athlete → Food Log → ALLOW
Athlete → daily metric → ALLOW
```

---

# 67. Client-side tests

Agregar tests para:

- Coaching tab hidden for standard user;
- Coaching tab hidden for athlete-only user;
- Coaching tab visible for capability-enabled Coach;
- Household tab visible for active member;
- Strategy editable when self-managed;
- Strategy read-only when coach-managed;
- Managed by Coach banner;
- Coach opens athlete detail;
- direct URL unauthorized → access denied/not found;
- Coach Strategy editor uses athlete subject;
- Personal Coach Strategy remains unaffected.

---

# 68. E2E principal

Escenario obligatorio:

```text
User A has coaching capability
→ creates/owns Coaching Space
→ invites User B
→ B accepts
→ relationship active
→ A opens Coaching
→ A opens B
→ A edits/publishes Strategy
→ B opens /app/strategy
→ B sees exact published Strategy
→ B cannot edit managed prescribed fields
→ B completes workout
→ A sees execution/progress
```

Éste es el flujo más importante del producto.

Si no funciona end-to-end, Coaching no está terminado.

---

# 69. E2E coexistencia

Escenario:

```text
User A has Household + Coaching
```

Verificar:

- Household funciona;
- Grocery funciona;
- Personal funciona;
- Coaching funciona;
- cambios en Coaching no alteran Household.

---

# 70. E2E atleta + Coach

Escenario:

```text
User A is athlete of Coach X
AND
User A manages Athlete B
```

Verificar:

- `/app/strategy` de A muestra Strategy gestionada por X;
- `/app/coach` de A muestra B;
- A puede gestionar B;
- A no puede autoeditar su Strategy bloqueada simplemente por ser Coach de otra persona.

---

# 71. Error handling

No mostrar mensajes genéricos para todo.

Diferenciar:

```text
not authorized
relationship ended
athlete not found
space unavailable
capability disabled
invitation expired
already member
already invited
capacity reached
publish conflict
invalid strategy
```

No exponer detalles SQL internos.

---

# 72. Loading states

Coach screens deben tener:

- initial loading;
- refresh loading;
- empty roster;
- no Strategy yet;
- no history;
- no metrics;
- failed load;
- unauthorized;
- relationship ended.

Evitar pantallas en blanco.

---

# 73. Empty Coach state

Si el Coach tiene capability pero aún no tiene atletas:

```text
Your Coaching Space is ready.
Invite your first athlete.
```

CTA:

```text
Invite athlete
```

No mostrar analytics falsos.

---

# 74. Empty Strategy

Si atleta no tiene plan:

Coach:

```text
No Strategy published yet.
Create first Strategy.
```

Athlete:

```text
No Strategy configured yet.
```

Si coach-managed:

```text
Your coach has not published your first Strategy yet.
```

---

# 75. Status de relación

UI debe diferenciar:

```text
invited
active
paused
ended
revoked
```

Aunque primera versión use subset.

No considerar `space_members` por sí sola suficiente para decir:

```text
this Coach manages this Athlete
```

Usar relationship.

---

# 76. Remoción y acceso inmediato

Cuando Coach remueve Athlete:

- relationship deja de autorizar;
- roster actualiza;
- Coach detail route deja de funcionar;
- Realtime/caches limpian datos;
- Strategy del atleta permanece;
- atleta recupera self-management.

No esperar nuevo login.

---

# 77. Privacidad

No ampliar `profile_visibility` ni `progress_visibility` para “simular” Coaching.

Coaching access es:

```text
relationship-based authorization
```

No social visibility.

Separar:

```text
PUBLIC/FOLLOWER visibility
```

de:

```text
COACH authorization
```

---

# 78. Seguridad de URL

Ruta:

```text
/app/coach/athletes/:athleteId
```

no debe filtrar si existe un usuario no autorizado.

Para no autorizado, preferir respuesta equivalente a:

```text
not found / access denied
```

sin revelar datos.

---

# 79. Audit actor vs subject

Todas las mutaciones de Coach deben distinguir:

```text
actor_user_id = Coach
target_user_id = Athlete
```

No registrar el cambio como si hubiera sido hecho por Athlete.

Esto será esencial para:

- soporte;
- debugging;
- version history;
- confianza.

---

# 80. Strategy version creator

`created_by` debe guardar el actor real.

Ejemplos:

```text
Athlete saves self version
created_by = athlete
```

```text
Coach publishes
created_by = coach
user_id = athlete
```

Nunca confundir ownership con authorship.

---

# 81. Strategy snapshot mínimo

El snapshot debe contener estructura versionada.

Ejemplo conceptual:

```json
{
  "schemaVersion": 1,
  "goals": {
    "dailySteps": 10000
  },
  "nutrition": {
    "calories": 2300,
    "protein": 180,
    "carbs": 250,
    "fats": 70,
    "fiber": 30
  },
  "training": {
    "days": []
  }
}
```

Agregar:

```text
schemaVersion
```

obligatorio.

No asumir que snapshots históricos siempre tendrán el mismo formato.

---

# 82. Snapshot validation

Antes de publish:

- schema version válida;
- valores numéricos válidos;
- IDs de ejercicios existentes;
- weekdays válidos;
- orden válido;
- sets > 0;
- rest >= 0;
- macros >= 0;
- ninguna referencia a recursos no autorizados.

---

# 83. Compatibility con ejercicios eliminados

Si un ejercicio histórico deja de estar disponible:

- Strategy histórica debe seguir renderizando información mínima;
- sesiones históricas no deben romperse.

No borrar referencias requeridas por historial.

---

# 84. Plan actual vs sesión

Cuando se crea `WorkoutSession`, considerar guardar o conservar suficiente contexto del plan usado.

Objetivo:

```text
historical session
does not mutate
when Strategy changes
```

Si el modelo actual no lo garantiza, elevar como deuda P0 antes de Draft/Publish completo.

---

# 85. Orden de implementación refinado

## Fase 0 — Auditoría

1. inspeccionar schema actual de Coaching;
2. inspeccionar RPCs;
3. inspeccionar RLS;
4. inspeccionar `/app/coach`;
5. inspeccionar Strategy;
6. localizar todas las fuentes de objetivos;
7. documentar contradicciones.

Entregable:

```text
docs/COACHING_STRATEGY_INTEGRATION_ANALYSIS.md
```

---

## Fase 1 — Capabilities

Implementar:

```text
user_capabilities
```

o equivalente justificado.

Agregar:

```text
hasCapability()
```

Resolver navegación.

Acceptance:

- standard user no ve Household/Coaching salvo relación requerida;
- Coach capability controla Coaching;
- athlete-only no ve Coaching.

---

## Fase 2 — Athlete private detail

Completar:

```text
/app/coach/athletes/:athleteId
```

con RPC segura.

Tabs iniciales:

- Overview;
- Strategy;
- Progress;
- History.

No PublicProfile.

---

## Fase 3 — Strategy Management

Implementar estado:

```text
self-managed
coach-managed
```

Activar al aceptar Coaching según reglas.

Actualizar `/app/strategy`.

Acceptance:

- atleta ve Strategy actual;
- ve quién la gestiona;
- planning bloqueado;
- execution intacta.

---

## Fase 4 — Coach edits Strategy

Permitir Coach:

- goals;
- nutrition;
- workout days;
- exercises;
- sets;
- reps;
- target weight;
- rest;
- notes.

Todo server-authorized.

---

## Fase 5 — Versioning

Completar `strategy_versions`:

- created_by;
- status;
- effective dates;
- version number;
- change reason;
- schemaVersion;
- history;
- compare;
- restore.

---

## Fase 6 — Draft/Publish

Implementar:

```text
Draft → Publish → Current
```

con publish transaccional.

---

## Fase 7 — Invitations

Completar:

- cancel;
- expire;
- resend;
- history;
- errors específicos.

---

## Fase 8 — Notes + Audit

Implementar Coach Notes y audit log.

---

## Fase 9 — Hardening

- RLS tests;
- E2E;
- Realtime selectivo;
- error handling;
- accessibility;
- performance;
- documentation.

---

## Fase 10 — Compatibility de Spaces

Sólo después del flujo Coaching estable:

- revisar household ↔ spaces;
- no big-bang rename;
- mantener Nutrition/Grocery.

---

## Fase 11 — Custom Exercises / Media

Después de Coaching core.

---

## Fase 12 — AI

Después de workflows deterministas.

---

## Fase 13 — Billing

Última etapa.

Billing podrá transformar:

```text
future entitlement
→ capability
```

sin rediseñar Coaching.

---

# 86. P0 actualizado

P0 ya NO debe describirse solamente como:

```text
private athlete view
permissions
invitations
```

El verdadero P0 es:

```text
1. Capability model
2. Navigation rules
3. Athlete private detail
4. Strategy ownership vs management
5. Coach-managed Strategy
6. RLS for actor/subject writes
7. Athlete Strategy read-only behavior
8. Strategy version source-of-truth
```

Sin esto, las siguientes features seguirán construyéndose sobre una definición ambigua.

---

# 87. P1 actualizado

```text
1. Coach Strategy Editor
2. Training plan management
3. Nutrition management
4. Draft/Publish
5. History/Compare/Restore
6. Coach Notes
7. Audit
8. Invitation lifecycle
```

---

# 88. P2 actualizado

```text
1. Multi-space UX
2. Household compatibility
3. More granular permissions
4. Privacy refinements
5. Realtime optimization
```

---

# 89. P3

```text
1. Custom Exercises
2. User media
3. Moderation
4. Public exercise content
5. Reporting
```

---

# 90. Billing sigue separado

No agregar Billing dentro de P0/P1.

Sólo dejar preparado:

```text
hasCapability()
```

para que en el futuro:

```text
subscription entitlement
→ grants capability
```

No crear ahora:

- `subscriptions`;
- checkout;
- pricing;
- invoices;
- Stripe webhooks;
- seat purchases.

---

# 91. No hacer

Los agentes NO deben:

- crear un tipo global `coach`;
- crear un tipo global `athlete`;
- crear un “Athlete Dashboard” separado;
- mostrar Coaching tab al atleta sólo por membership;
- crear tablas duplicadas `coach_workouts`;
- crear `coach_nutrition`;
- cambiar ownership de datos al Coach;
- permitir Coach UPDATE general sobre `profiles`;
- permitir Coach editar execution history;
- mezclar Household permissions con Coach permissions;
- migrar Household a Spaces en el mismo cambio que Strategy;
- usar frontend como seguridad;
- desactivar RLS;
- usar service role en browser;
- cargar datos de todos los atletas en `FitnessContext`;
- hardcodear billing plan names;
- reactivar AI Actions;
- implementar Custom Media antes de cerrar Coaching Strategy;
- destruir Strategy al remover un atleta.

---

# 92. Definition of Done — Coaching Core

Coaching Core se considera funcional cuando el siguiente escenario funciona completamente:

```text
1. User A tiene coaching capability.
2. User A puede acceder a Coaching.
3. User B no tiene coaching capability.
4. A invita a B.
5. B acepta.
6. B NO obtiene pestaña Coaching.
7. A ve B en roster.
8. A abre el detalle privado de B.
9. A crea/modifica Strategy para B.
10. El backend valida A → B.
11. A publica Strategy.
12. B abre su `/app/strategy`.
13. B ve exactamente lo publicado.
14. B no puede editar los campos gestionados.
15. B puede ejecutar entrenamiento normalmente.
16. B registra series reales.
17. B registra Food Log/métricas reales.
18. A ve progreso autorizado.
19. A no puede modificar la ejecución histórica de B.
20. A remueve a B.
21. A pierde acceso inmediatamente.
22. B conserva Strategy e historial.
23. B recupera self-management.
```

---

# 93. Definition of Done — Coexistencia

También debe funcionar:

```text
Coach A
├── Personal
├── Household
└── Coaching
```

sin regresiones.

Y:

```text
User B
├── Personal
├── Household
└── Athlete of Coach A
```

sin mostrar una segunda app.

---

# 94. Verificación final obligatoria

Ejecutar:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

Agregar además:

- RLS integration tests;
- Coaching RPC tests;
- Strategy publish tests;
- actor/subject authorization tests;
- E2E happy path;
- E2E unauthorized path;
- E2E remove/revoke path.

No considerar una fase cerrada si sólo funciona visualmente.

---

# 95. Documentación a actualizar

Después de cada fase relevante actualizar:

```text
DOCUMENTACION_TECNICA.md
REMAINING_WORK_AND_DECISIONS.md
```

y crear/mantener:

```text
COACHING_STRATEGY_INTEGRATION_ANALYSIS.md
```

Documentar:

- schema;
- capability model;
- navigation matrix;
- Strategy management;
- RLS;
- RPCs;
- versioning;
- tests;
- known limitations.

---

# 96. Principio rector final

Todo cambio debe evaluarse contra esta frase:

> **El usuario siempre conserva su experiencia personal y el ownership de sus datos. Household y Coaching son capacidades y relaciones adicionales. Un Coach no obtiene una segunda copia de los datos del atleta: obtiene autorización para administrar la Strategy real del atleta. El atleta sigue usando la misma Strategy, Training, Nutrition, Progress e History de siempre. Coaching es únicamente la capa administrativa que permite al Coach gestionar a múltiples usuarios autorizados.**

Si una implementación contradice este principio, debe rechazarse o rediseñarse antes de integrarla.

---

# 97. Primer trabajo que deben ejecutar los agentes

Comenzar por un análisis, no por UI.

Crear:

```text
docs/COACHING_STRATEGY_INTEGRATION_ANALYSIS.md
```

Debe responder con evidencia del código real:

1. ¿Dónde se almacenan hoy todos los campos visibles en Strategy?
2. ¿Qué campos están duplicados entre `profiles`, `nutrition_plans` y otras tablas?
3. ¿Qué RPCs de Coaching existen realmente?
4. ¿Qué RLS existe realmente?
5. ¿Cómo se determina hoy si un usuario ve `/app/coach`?
6. ¿Cómo se carga el roster?
7. ¿Cómo se valida Coach → Athlete?
8. ¿Cómo funciona actualmente `strategy_versions`?
9. ¿Cómo se publica Realtime para tablas de Coaching?
10. ¿Qué partes de `FitnessContext` suponen que actor == subject?
11. ¿Qué partes de `repository.ts` sólo permiten self writes?
12. ¿Qué componentes de `StrategyPage` pueden extraerse y reutilizarse?
13. ¿Cómo preservar Household sin tocar su modelo operativo?
14. ¿Qué migraciones concretas son necesarias para capabilities y Strategy management?
15. ¿Qué tests faltan antes de permitir que un Coach escriba sobre datos de otro usuario?

Luego proponer una secuencia de migraciones y cambios de frontend.

No comenzar a implementar Coach Strategy writes hasta que esta auditoría esté completa y las reglas de ownership/management estén reflejadas explícitamente en schema + RLS + RPC.

---

# 98. Resultado esperado del refinamiento

Al finalizar estas etapas, Train Together debe dejar de pensar Coaching como “otro grupo más” y pasar a entenderlo como:

```text
Capability
    ↓
Coach administrative surface
    ↓
Authorized Coach/Athlete relationship
    ↓
Management of Athlete's real Strategy
    ↓
Athlete continues using normal personal experience
```

Éste es el modelo que debe guiar todo el desarrollo posterior.

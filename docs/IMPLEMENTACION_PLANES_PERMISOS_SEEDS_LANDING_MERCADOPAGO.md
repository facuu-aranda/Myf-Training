# Implementación comercial de Nuvia / Train Together
## Features por plan, permisos y entitlements, dataset demo, Landing y Mercado Pago

> **Estado de referencia:** 2026-09-09  
> **Proyecto actual:** Train Together / MyF-Training  
> **Nombre futuro del producto:** Nuvia  
> **Stack web actual:** React 19 + Vite + TypeScript + Supabase/PostgreSQL/RLS/Realtime  
> **Mobile:** Expo + React Native en desarrollo paralelo  
> **Proveedor de billing inicial:** Mercado Pago  
> **Objetivo:** completar las funcionalidades necesarias para que los planes comerciales sean reales, crear una capa de autorización basada en entitlements, poblar un entorno demo exhaustivo, actualizar completamente la Landing y, recién después, integrar Mercado Pago sobre esa foundation.
>
> Este documento es un **prompt maestro de implementación para agentes**. No debe interpretarse como una lista de ideas opcionales. Las decisiones marcadas como “obligatorias”, “no hacer” o “Definition of Done” forman parte del contrato de implementación.

---

# 0. Objetivo general

El producto ya posee una base funcional extensa de:

- autenticación;
- perfiles;
- Strategy;
- entrenamiento;
- Live Training;
- Quick Log;
- historial;
- progreso;
- Nutrition;
- Food Log;
- Meal Planner;
- Grocery;
- Household;
- perfiles públicos;
- ejercicio;
- AI read-only;
- Realtime;
- RLS;
- foundation de Coaching;
- `spaces`;
- `space_members`;
- `coach_athlete_relationships`;
- `space_invitations`;
- Coach Dashboard inicial;
- roster de atletas;
- snapshot inicial de `strategy_versions`.

Sin embargo, **los planes comerciales todavía no existen como autorización real**.

En la arquitectura actual:

```text
Landing pricing copy
≠
real product entitlement
```

y todavía faltan o deben consolidarse:

```text
plans
prices
subscriptions
entitlements
billing customers
subscription events
usage limits
server-side gates
Mercado Pago
plan-aware UI
demo accounts by plan
landing aligned with the real product
```

La implementación deberá convertir la visión comercial en un sistema real y verificable.

---

# 1. Principio rector

La aplicación NO debe preguntar:

```ts
if (plan === 'PLUS') { ... }
```

por todas partes.

Tampoco:

```ts
if (subscription.provider === 'mercadopago') { ... }
```

para decidir acceso a features.

El modelo correcto es:

```text
Subscription / Sponsorship / Admin Grant
                  ↓
             Entitlements
                  ↓
          Effective Capabilities
                  ↓
              UI + RLS/RPC
```

La aplicación debe preguntar:

```text
¿Puede este usuario hacer X?
```

Ejemplos:

```text
canUseAI
canCreateCustomFood
canCreateCustomExercise
canCreateHousehold
canManageCoaching
maxHouseholdMembers
maxActiveAthletes
canUseCoachTemplates
canExportReports
```

Mercado Pago será solamente **una fuente futura de entitlement**, no la fuente de lógica de producto.

---

# 2. Orden obligatorio de trabajo

No integrar Mercado Pago primero.

El orden será:

```text
0. Audit real del código
1. Catálogo de planes
2. Entitlements + resolver efectivo
3. Feature gates server-side
4. Features faltantes de Free/Plus
5. Couple/Household comercial
6. Coaching Core / Coach Starter
7. Coach Pro
8. Ads foundation
9. Seeds completos
10. Tests de permisos y convivencia
11. Nueva Landing
12. Billing foundation
13. Mercado Pago sandbox
14. Mercado Pago producción
15. Mobile billing/entitlement flows compatibles con stores
16. Hardening / observabilidad / documentación
```

No saltarse etapas.

---

# 3. Auditoría inicial obligatoria

Antes de escribir nuevas migraciones, crear:

```text
docs/COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md
```

El documento debe inspeccionar código real y responder:

1. Qué features de cada plan ya existen.
2. Qué features existen parcialmente.
3. Qué features no existen.
4. Qué rutas están afectadas.
5. Qué tablas están afectadas.
6. Qué RLS actual impide las nuevas operaciones.
7. Qué RPCs ya existen.
8. Qué lógica sigue dependiendo del usuario autenticado como único writable owner.
9. Qué parte de Coaching ya está implementada.
10. Qué parte del refinamiento de Strategy/Coach falta.
11. Cómo se representa hoy Household/Duo.
12. Cómo se representa actualmente `strategy_versions`.
13. Cómo se manejan custom foods actualmente.
14. Si existe creación de custom exercises o sólo catálogo read-only.
15. Qué AI limits existen hoy.
16. Si existe infraestructura de exports.
17. Qué analytics ya están calculados.
18. Qué componentes se pueden reutilizar.
19. Qué copy comercial existe hoy en Landing.
20. Qué tests cubren RLS/autorización.
21. Qué estado real tiene el proyecto remoto.
22. Qué cambios de schema pueden ser aditivos.
23. Qué cambios requieren migración de datos.
24. Qué deuda técnica debe resolverse antes de cobrar dinero.

No empezar Mercado Pago antes de completar este análisis.

---

# 4. Catálogo comercial definitivo inicial

Los planes públicos iniciales serán:

```text
FREE
PLUS
COUPLE
HOUSEHOLD
COACH_STARTER
COACH_PRO
```

Reservar, pero NO lanzar:

```text
COACH_STUDIO
```

---

# 5. Precios sugeridos

Los precios deben estar centralizados y nunca hardcodeados en múltiples componentes.

## 5.1 Referencia USD

```text
FREE             USD 0
PLUS             USD 4.99 / month
COUPLE           USD 8.99 / month
HOUSEHOLD        USD 14.99 / month
COACH_STARTER    USD 19.99 / month
COACH_PRO        USD 39.99 / month
```

## 5.2 Precio inicial sugerido ARS

```text
FREE             ARS 0
PLUS             ARS 7,990 / month
COUPLE           ARS 13,990 / month
HOUSEHOLD        ARS 22,990 / month
COACH_STARTER    ARS 29,990 / month
COACH_PRO        ARS 59,990 / month
```

Estos valores deberán poder cambiar sin deploy.

## 5.3 Annual

Dos meses equivalentes gratis:

```text
annual price = monthly × 10
```

Inicialmente:

```text
PLUS             ARS 79,900 / year
COUPLE           ARS 139,900 / year
HOUSEHOLD        ARS 229,900 / year
COACH_STARTER    ARS 299,900 / year
COACH_PRO        ARS 599,900 / year
```

Referencia USD:

```text
PLUS             USD 49.90 / year
COUPLE           USD 89.90 / year
HOUSEHOLD        USD 149.90 / year
COACH_STARTER    USD 199.90 / year
COACH_PRO        USD 399.90 / year
```

La moneda cobrada por Mercado Pago Argentina en la primera etapa será ARS.

---

# 6. FREE

## 6.1 Objetivo

Producto individual usable que permita:

- probar Nuvia;
- crear hábito;
- registrar entrenamiento;
- usar nutrición;
- generar datos;
- convertirse a Plus;
- ser invitado a Couple/Household;
- convertirse en atleta patrocinado por un Coach.

Free NO debe sentirse como una demo rota.

## 6.2 Incluye

```text
Personal Space
Dashboard
Strategy personal
Workout planning
Live Training
Manual Training
Quick Log
Basic Nutrition
Food Log
Food Library
Exercise Library
Daily Metrics
Basic Progress
Limited History
Basic personal analytics
```

## 6.3 No incluye

```text
AI
custom foods creation
custom exercises creation
advanced personal analytics
exports
strategy version history
Household creation
Coaching Space creation
Coach management
public user-generated exercise publishing
premium future features
```

## 6.4 Ads

```text
ads = enabled
```

pero con reglas estrictas definidas más adelante.

## 6.5 History limit

NO borrar datos antiguos.

Free conserva toda la información en DB.

La limitación es de acceso/visualización.

Inicial:

```text
history_view_days = 30
```

El usuario puede ver los últimos 30 días.

Al hacer upgrade, aparece el historial anterior.

No eliminar nunca sesiones antiguas por downgrade.

## 6.6 Progress ranges

Free:

```text
7 days
30 days
```

No:

```text
90
180
all
```

---

# 7. PLUS

## 7.1 Precio

```text
USD 4.99
ARS 7,990
```

## 7.2 Target

Usuario individual comprometido.

## 7.3 Incluye Free +

```text
no ads
full history
all Progress ranges
advanced personal analytics
limited AI
exports
personal Strategy versions
custom foods
custom exercises
future personal premium features
```

## 7.4 AI

Inicial:

```text
50 AI interactions per billing period
```

Definir “interaction” de forma determinística.

No contar tokens directamente en UI.

Una interacción facturable debe representar una acción del usuario que inicia una ejecución AI.

Los loops internos no deben consumir múltiples créditos visibles sin regla.

Guardar:

```text
usage_period_start
usage_period_end
ai_interactions_used
```

## 7.5 Custom Foods

Plus puede:

```text
create
edit
delete
favorite
use in Food Log
use in recipes
use in Meal Planner
```

Custom foods son privados por defecto.

No publicar globalmente automáticamente.

## 7.6 Custom Exercises

Plus puede:

```text
create
edit
archive
use in Strategy
use in sessions
```

Privados por defecto.

Media/public moderation queda en fase posterior si todavía no está lista.

## 7.7 Strategy Versions

Plus puede:

```text
list
view
compare
restore
```

sus versiones personales.

Restore siempre genera nueva versión.

---

# 8. COUPLE

## 8.1 Precio

```text
USD 8.99
ARS 13,990
```

## 8.2 Capacidad

```text
2 total users
owner + 1 member
```

## 8.3 Incluye

Owner:

```text
PLUS personal benefits
household_create
max_members = 2
```

Member:

```text
PLUS sponsored benefits
```

Mientras membership esté activa.

Ambos:

```text
no ads
full history
advanced personal analytics
50 AI interactions
custom foods
custom exercises
Strategy versions
exports
```

Además:

```text
shared Grocery
shared Meal Planner where applicable
activity
shared progress
household nutrition
invitations
joint tracking
```

## 8.4 Regla crítica

El member NO recibe:

```text
household_create
```

por herencia.

Recibe beneficios personales Plus patrocinados.

---

# 9. HOUSEHOLD

## 9.1 Precio

```text
USD 14.99
ARS 22,990
```

## 9.2 Capacidad

```text
5 total users
owner + 4 members
```

Corregir cualquier copy legacy que diga:

```text
owner + 1
```

## 9.3 Beneficios

Owner:

```text
PLUS
household_create
max_members = 5
```

Members:

```text
PLUS sponsored
```

Mientras membership esté activa.

Además:

- Grocery;
- Meal Planner;
- Household progress;
- nutrition sharing;
- invites;
- joint activity;
- shared features existentes.

---

# 10. COACH STARTER

## 10.1 Precio

```text
USD 19.99
ARS 29,990
```

## 10.2 Capacidad

```text
10 active athletes
```

## 10.3 Filosofía

Coach Starter NO es una demo profesional.

Debe permitir a un entrenador trabajar de verdad.

No bloquear features básicas de Coaching para obligar a Pro.

## 10.4 Incluye

Personal account:

```text
all PLUS benefits
```

Professional:

```text
Coaching Space
Coach Dashboard
Athlete roster
Invitations
10 active athletes
private athlete view
Strategy management
Workout management
Nutrition prescription
Goals management
Progress access
History access
Coach Notes
Strategy Versions
Draft / Publish
basic coaching analytics
```

## 10.5 Core Strategy

El Coach administra la Strategy real del atleta.

No crear copias paralelas.

Actor:

```text
Coach
```

Subject:

```text
Athlete
```

Data owner:

```text
Athlete
```

## 10.6 Athlete sponsored experience

Los atletas NO necesitan pagar.

Mientras relación activa:

```text
no ads
full Strategy required for coaching
full workout history required for coaching
full Progress required for coaching
Coach-managed Strategy support
```

Pero NO heredan automáticamente:

```text
50 personal AI interactions
custom personal foods
custom personal exercises
personal exports
Household create
Coaching create
```

salvo que tengan otra subscription propia.

---

# 11. COACH PRO

## 11.1 Precio

```text
USD 39.99
ARS 59,990
```

## 11.2 Capacidad

```text
30 active athletes
```

## 11.3 Incluye Coach Starter +

```text
advanced coaching analytics
roster analytics
Needs Attention
program templates
nutrition templates
duplicate Strategy
assign Strategy/template
advanced adherence analytics
professional reports
advanced exports
higher AI quota
Coach custom exercise library
```

---

# 12. Coach Pro — Advanced Coaching Analytics

Por atleta:

```text
workout adherence
volume trend
average RPE
weight trend
step adherence
nutrition adherence
PR evolution
session consistency
```

Rangos:

```text
7
30
90
180
all
```

No crear métricas médicas.

No diagnosticar lesiones.

---

# 13. Coach Pro — Roster Analytics

Vista agregada:

```text
total athletes
active this week
inactive athletes
average adherence
recent PRs
missed sessions
Needs Attention
```

Permitir ordenar por:

```text
adherence ascending
last workout
recent activity
weight update age
strategy update age
```

---

# 14. Needs Attention

Crear reglas determinísticas.

Ejemplos iniciales:

```text
no workout >= 5 days when workouts planned
workout adherence < 60%
step adherence < 60%
nutrition adherence < 60% if permitted
RPE trend unusually high
reported pain > configured threshold
```

No presentar estas reglas como diagnóstico.

Mostrar:

```text
"May need attention"
```

No:

```text
"At risk"
```

sin fundamento.

---

# 15. Program Templates

Coach Pro puede crear templates reutilizables.

Modelo:

```text
coach_program_templates
coach_program_template_days
coach_program_template_exercises
```

O snapshot JSON versionado si resulta más adecuado.

El template es una fuente.

Al asignarlo:

```text
Template
→ clone
→ Athlete Strategy draft
```

No compartir una Strategy mutable entre múltiples atletas.

---

# 16. Nutrition Templates

Crear templates para:

```text
calories
protein
carbs
fats
fiber
notes
optional planned meal structure
```

Asignación:

```text
template
→ clone
→ athlete draft
```

---

# 17. Duplicate Strategy

Permitir:

```text
Athlete A current Strategy
→ duplicate
→ Athlete B draft
```

Copiar:

- goals;
- nutrition;
- workout days;
- exercises;
- sets;
- reps;
- target weight;
- rest;
- notes.

No copiar:

- Food Log;
- sessions;
- PRs;
- body weight history;
- personal metrics.

---

# 18. Professional Reports

Coach Pro podrá generar:

```text
Monthly Athlete Report
```

Datos:

```text
period
workout adherence
sessions
volume
weight trend
steps
nutrition adherence
PRs
Strategy changes
```

Export:

```text
PDF
CSV where appropriate
shareable generated report
```

No incluir Coach private notes salvo selección explícita.

---

# 19. Coach Custom Exercise Library

Coach Pro puede crear ejercicios propios para reutilizar con sus atletas.

Ownership:

```text
owner_user_id = coach
owner_space_id = coaching space
visibility = private/space
```

No hacerlos públicos automáticamente.

Todos los atletas autorizados pueden consumir el ejercicio mientras corresponda.

El historial no debe romperse si después se archiva.

---

# 20. COACH STUDIO

Reservar:

```text
COACH_STUDIO
```

No vender.

No mostrar como plan disponible.

No implementar aún:

- organizations multi-coach;
- assistant coaches;
- coach seats;
- org roles;
- bulk team management;
- white-label.

Puede aparecer en código solamente como:

```text
reserved/future
```

si ayuda a evitar migraciones destructivas futuras.

---

# 21. Modelo de PlanCode

Crear enum/union canónico:

```ts
type PlanCode =
  | 'free'
  | 'plus'
  | 'couple'
  | 'household'
  | 'coach_starter'
  | 'coach_pro'
  | 'coach_studio'
```

No repetir strings arbitrarios.

---

# 22. Tablas comerciales

Crear foundation antes de Mercado Pago.

## 22.1 `plans`

Campos sugeridos:

```text
id
code
name
description
active
public
sort_order
created_at
updated_at
```

Unique:

```text
code
```

## 22.2 `plan_prices`

```text
id
plan_id
currency
billing_interval
amount_minor
active
valid_from
valid_until nullable
provider nullable
provider_price_id nullable
created_at
updated_at
```

`amount_minor` evita floats.

## 22.3 `entitlement_definitions`

```text
key
type
description
default_value
```

## 22.4 `plan_entitlements`

```text
plan_id
entitlement_key
value jsonb
```

## 22.5 `billing_customers`

```text
id
user_id
provider
provider_customer_id nullable
payer_email nullable
metadata
created_at
updated_at
```

## 22.6 `subscriptions`

```text
id
user_id
plan_id
plan_price_id
provider
provider_subscription_id nullable
status
billing_interval
currency
amount_minor
current_period_start
current_period_end
cancel_at_period_end
canceled_at
trial_ends_at nullable
grace_ends_at nullable
metadata
created_at
updated_at
```

## 22.7 `subscription_events`

```text
id
provider
provider_event_id
event_type
subscription_id nullable
provider_subscription_id nullable
status
payload jsonb
processed_at
processing_error nullable
created_at
```

Unique:

```text
provider + provider_event_id
```

Cuando Mercado Pago no provea un event ID estable para cierto topic, crear una key determinística basada en los campos recomendados por su contrato actual.

## 22.8 `entitlement_grants`

Para beneficios no originados directamente por una subscription.

```text
id
user_id
bundle_code
source_type
source_id
starts_at
ends_at nullable
active
metadata
created_at
updated_at
```

Sources:

```text
subscription
household_membership
coaching_relationship
admin
seed
migration
```

---

# 23. Entitlement bundles

Crear bundles reutilizables.

## 23.1 `FREE_PERSONAL`

```text
ads = true
ai_monthly = 0
history_days = 30
progress_ranges = [7, 30]
advanced_personal_analytics = false
exports = false
strategy_versions = false
custom_foods_create = false
custom_exercises_create = false
```

## 23.2 `PLUS_PERSONAL`

```text
ads = false
ai_monthly = 50
history_days = unlimited
progress_ranges = [7, 30, 90, 180, all]
advanced_personal_analytics = true
exports = true
strategy_versions = true
custom_foods_create = true
custom_exercises_create = true
```

## 23.3 `HOUSEHOLD_MEMBER_PLUS`

Igual a Plus personal pero:

```text
household_create = false
```

## 23.4 `COACH_SPONSORED_ATHLETE`

```text
ads = false
history_days = unlimited
progress_ranges = [7, 30, 90, 180, all]
coach_managed_strategy = true
```

No incluye:

```text
ai
custom food create
custom exercise create
personal exports
```

---

# 24. Entitlements específicos

Lista inicial sugerida:

```text
ad_free
history_days
progress_ranges
advanced_personal_analytics
ai_monthly_interactions
exports_personal
strategy_versions_personal
custom_foods_create
custom_exercises_create

household_create
household_max_members
household_member_sponsorship

coaching_create
coaching_max_athletes
coach_athlete_private_view
coach_strategy_manage
coach_workout_manage
coach_nutrition_manage
coach_goals_manage
coach_progress_view
coach_history_view
coach_notes
coach_strategy_versions
coach_draft_publish
coach_basic_analytics

coach_advanced_analytics
coach_roster_analytics
coach_attention_queue
coach_program_templates
coach_nutrition_templates
coach_duplicate_strategy
coach_reports
coach_advanced_exports
coach_custom_exercise_library
coach_ai_monthly_interactions
```

---

# 25. Resolver efectivo

Crear una única fuente de verdad server-side.

RPC/view sugerida:

```text
get_effective_entitlements(user_id)
```

Para el usuario autenticado:

```text
get_my_effective_entitlements()
```

No aceptar `user_id` arbitrario desde browser sin RLS/autorización.

---

# 26. Precedencia de entitlements

El usuario puede recibir acceso desde múltiples fuentes.

Ejemplo:

```text
own Plus
+
Household member
+
Coach-sponsored athlete
```

Resolver:

## boolean

```text
OR
```

## numeric quota

Usar regla explícita por entitlement.

Para AI personal:

```text
MAX applicable personal quota
```

No sumar 50 + 50 por dos fuentes.

## history

`unlimited` domina.

## progress ranges

Union.

## creation rights

No heredar creation rights por membership salvo definición explícita.

Ejemplo:

```text
household_member PLUS sponsorship
does NOT grant household_create
```

---

# 27. Subscription ≠ membership

Nunca inferir:

```text
Couple subscription
→ every household membership exists
```

La subscription habilita capacidad.

La membership representa relaciones reales.

---

# 28. Free fallback

Todo usuario autenticado sin subscription activa recibe:

```text
FREE_PERSONAL
```

No es obligatorio insertar una subscription Free por usuario.

Preferencia:

```text
no paid subscription
→ effective base plan = free
```

---

# 29. Downgrade

Nunca borrar datos premium.

Ejemplos:

Plus → Free:

```text
custom foods remain stored
custom exercises remain stored
old history remains stored
Strategy versions remain stored
```

Pero:

```text
cannot create new premium resources
cannot access restricted historical views
```

Definir read access a custom resources creados durante Plus:

Recomendación:

```text
can continue using existing custom foods/exercises
cannot create/edit new premium content after downgrade
```

Evitar romper workouts.

---

# 30. Couple/Household expiration

Cuando owner pierde subscription:

- no borrar Household;
- no borrar Grocery;
- no borrar members;
- retirar sponsorship premium al finalizar período/grace;
- bloquear nuevas invitaciones si no existe entitlement;
- permitir export/leave;
- definir grace UI.

El household puede quedar:

```text
inactive/read-only
```

hasta reactivación.

---

# 31. Coaching expiration

Cuando Coach subscription deja de estar activa:

- Coach no puede invitar nuevos atletas;
- no puede publicar nuevas Strategies tras grace;
- datos de atletas NO se borran;
- relationships se preservan temporalmente;
- atleta conserva última Strategy publicada;
- atleta recupera self-management cuando se termina/revoca el relationship según reglas;
- Coach Notes privadas permanecen archivadas;
- no destruir historia.

---

# 32. Active athlete counting

Para límites Coach:

```text
count active coach_athlete_relationships
```

No contar:

```text
invited
declined
expired
removed
ended
```

Validación server-side.

No frontend-only.

---

# 33. RLS y autorización

Hoy varias tablas clave son self-write.

No abrirlas globalmente por plan.

Para Coach:

```text
actor = authenticated coach
subject = athlete
```

Validar:

```text
active coaching subscription entitlement
active space membership
active coach-athlete relationship
strategy manager authorization
feature entitlement
resource belongs to athlete
```

---

# 34. No hardcodear roles

Nunca:

```ts
role === 'coach' ? allowEverything : deny
```

Usar:

```text
relationship + entitlement + operation
```

---

# 35. Feature gate frontend

Crear:

```text
src/lib/entitlements.ts
```

o dominio equivalente.

API:

```ts
hasEntitlement(key)
getEntitlementValue(key)
canUseFeature(key)
```

Hook:

```ts
useEntitlements()
```

No convertir esto en seguridad real.

Es UX.

---

# 36. FeatureGate component

Ejemplo:

```tsx
<FeatureGate
  entitlement="custom_foods_create"
  fallback={<UpgradePrompt plan="plus" />}
>
  <CreateFoodButton />
</FeatureGate>
```

Centralizar.

---

# 37. UpgradePrompt

Debe conocer:

```text
required entitlement
recommended plan
current plan
```

No hardcodear un plan si varias opciones lo incluyen.

---

# 38. Plan comparison service

Crear función:

```text
getPlansThatGrant(entitlement)
```

para construir upsells correctos.

---

# 39. Features faltantes — Free/Plus

Antes de billing deben funcionar:

```text
history limit
Progress range limit
advanced personal analytics
AI quota
custom foods
custom exercises
personal exports
Strategy versions
ads gating
```

---

# 40. History gating

Query server-side donde sea posible.

No cargar todos los datos y esconderlos sólo con CSS.

Para Free:

```text
from today - 30 days
```

Para premium:

```text
full paginated history
```

---

# 41. Advanced Personal Analytics

Definir como mínimo:

```text
volume trend
workout adherence
step adherence
weight trend
RPE trend
training frequency
PR evolution
planned vs actual comparison
```

Free obtiene resumen básico.

Plus obtiene rangos y detalle.

---

# 42. AI quota

Crear server-side usage accounting.

No confiar en contador local.

Tabla sugerida:

```text
usage_counters
--------------------------------
id
user_id
metric
period_start
period_end
used
limit_snapshot
updated_at
```

Unique:

```text
user_id + metric + period_start
```

Metric:

```text
ai_interactions
coach_ai_interactions
```

---

# 43. AI failure

No cobrar cuota si:

- provider devuelve error antes de respuesta usable;
- request es rechazado por validation;
- server interno falla antes de ejecución.

Definir exactamente cuándo se consume.

---

# 44. AI Actions

Mantener las acciones avanzadas sujetas al backlog de estabilización.

No reactivar loops libres sólo porque Plus tenga IA.

Primero asegurar contract tests.

---

# 45. Custom Foods

Si ya existe custom food foundation, consolidarla.

Requisitos:

```text
owner_user_id
name
serving
calories
protein
carbs
fats
fiber
metadata
created_at
updated_at
archived_at
```

RLS:

```text
owner read/write
```

---

# 46. Custom Exercises

Extender `exercises` o crear modelo compatible sin duplicar catálogo.

Requisitos conceptuales:

```text
source_type = system | user | space
owner_user_id nullable
owner_space_id nullable
visibility = private | space | public | system
status
```

Para esta etapa:

```text
user-created default = private
coach-created default = space/private
```

Public/moderation puede quedar deshabilitado.

---

# 47. Coach Starter P0

Antes de poder cobrar Starter, debe funcionar end-to-end:

```text
invite athlete
accept invite
open athlete
manage Strategy
publish
athlete sees Strategy in /app/strategy
athlete executes workout
coach sees progress/history
notes
version history
remove/revoke
```

---

# 48. Athlete private view

Ruta:

```text
/app/coach/athletes/:athleteId
```

No `PublicProfilePage`.

Tabs:

```text
Overview
Strategy
Progress
History
Nutrition
Notes
```

---

# 49. Coach Strategy management

Debe permitir:

```text
steps
calories
macros
fiber
workout days
exercise selection
order
sets
reps
target weight
target seconds
rest
notes
```

---

# 50. Strategy Draft / Publish

Flujo:

```text
Current published
       ↓
Create draft
       ↓
Edit
       ↓
Review
       ↓
Publish atomically
       ↓
New current
```

Atleta usa current hasta publish.

---

# 51. Strategy versions

Completar:

```text
created_by
version_number
status
effective_from
effective_until
change_reason
schema_version
snapshot
published_at
space_id
relationship_id
```

---

# 52. Restore

```text
old version
→ new draft
→ publish as new version
```

Nunca reactivar fila histórica directamente.

---

# 53. Coach Notes

Tabla separada.

```text
private
shared
```

Private nunca visible al atleta.

---

# 54. Audit Log

Registrar:

```text
athlete_invited
athlete_added
athlete_removed
strategy_draft_created
strategy_published
strategy_restored
coach_changed_goals
coach_changed_workout
coach_changed_nutrition
note_created
permission_changed
```

Actor ≠ subject.

---

# 55. Coach Pro analytics

No comenzar hasta Coach Starter estable.

Crear queries agregadas server-side o repository scoped.

No cargar todos los sets de 30 atletas en frontend.

---

# 56. Pagination

Coach Pro:

- roster paginado;
- history paginada;
- reports paginados;
- templates paginados si crecen.

---

# 57. Templates versioning

Templates deben poder evolucionar.

Una actualización del template NO modifica automáticamente Strategies ya asignadas.

---

# 58. Ads foundation

Free tendrá anuncios.

Premium/sponsored users no.

Crear abstracción:

```text
AdProvider
AdSlot
```

Entitlement:

```text
ad_free
```

---

# 59. Lugares permitidos para ads

Posibles:

```text
Dashboard
Exercise Library
Progress
History list
Food Library
```

No usar:

```text
Live Training
rest timer
set logging
critical Strategy editor
Food Log entry flow
Coach athlete editor
payment flow
onboarding
```

---

# 60. Ads y datos sensibles

No usar:

- peso;
- dieta;
- calorías;
- lesiones;
- pain level;
- fitness progress;

para targeting.

Preferir:

```text
non-personalized/contextual
```

Implementar consentimiento y privacy según plataforma.

---

# 61. Ads sin credenciales

Si la red publicitaria no está configurada:

```text
render nothing
```

No romper layout.

No usar ads fake en producción.

---

# 62. Dataset demo — objetivo

Crear un entorno demo que permita:

- probar cada plan;
- probar cada role;
- probar sponsorship;
- probar límites;
- probar Coaching;
- probar dashboards con datos realistas;
- crear capturas para Landing;
- ejecutar E2E;
- reproducir bugs.

Los datos serán **ficticios y sintéticos**.

Nunca usar datos de personas reales.

---

# 63. Password demo

Todos los usuarios Supabase demo:

```text
1q2w3e4r5t6y
```

OBLIGATORIO:

- sólo local/staging;
- nunca producción;
- nunca cuentas reales;
- nunca reutilizar en Mercado Pago real.

Variable sugerida:

```text
DEMO_SEED_PASSWORD=1q2w3e4r5t6y
```

El seed debe rechazar ejecución contra producción.

---

# 64. Protección del seed

Agregar:

```text
ALLOW_DEMO_SEED=false
```

Para ejecutar:

```text
ALLOW_DEMO_SEED=true
```

y validar:

- Supabase project ref allowlisted;
- environment != production;
- hostname esperado;
- confirmación programática explícita.

No pedir confirmación interactiva para CI.

---

# 65. Seed reference date

Para datos reproducibles:

```text
DEMO_REFERENCE_DATE=2026-09-09
```

Permitir override.

Todas las fechas relativas salen de ese anchor.

---

# 66. Usuarios demo — Free

## `demo.free`

```text
display_name: Sofía Benítez
username: demo.free
email: demo.free@nuvia.local
plan: FREE
```

Datos:

- 45 días de uso;
- 3 workouts/semana;
- history >30 días para verificar bloqueo;
- steps variables;
- no custom foods;
- no custom exercises;
- AI usage = 0;
- ads enabled.

---

# 67. Usuario demo — Plus

## `demo.plus`

```text
display_name: Martín Sosa
username: demo.plus
email: demo.plus@nuvia.local
plan: PLUS
```

Datos:

- 120 días;
- 4 workouts/semana;
- full history;
- 4 Strategy versions;
- 6 custom foods;
- 4 custom exercises;
- 20 AI interactions usadas de 50;
- exports available;
- advanced analytics con tendencias.

---

# 68. Couple demo

## Owner

```text
username: demo.couple.lucia
display_name: Lucía Ferrero
email: demo.couple.lucia@nuvia.local
plan: COUPLE owner
```

## Member

```text
username: demo.couple.tomas
display_name: Tomás Herrera
email: demo.couple.tomas@nuvia.local
own paid plan: none
effective benefit: sponsored PLUS
```

Household:

```text
name: Lucía & Tomás
type: duo
max_members: 2
```

---

# 69. Couple data

Crear:

- ambos con 90 días de metrics;
- distintos objetivos;
- distintos workouts;
- shared grocery;
- shared Meal Planner;
- shared progress;
- activity feed;
- recipes;
- Food Log with privacy mix;
- invitations history;
- no ads;
- AI quota per sponsored Plus user.

---

# 70. Household demo

## Owner

```text
demo.family.ana
Ana Rodríguez
HOUSEHOLD owner
```

Members:

```text
demo.family.diego       Diego Rodríguez
demo.family.valentina   Valentina Rodríguez
demo.family.joaquin     Joaquín Rodríguez
demo.family.elena       Elena Rodríguez
```

Total:

```text
5
```

---

# 71. Household data

Crear:

- weekly Grocery;
- 2 historical grocery lists;
- Meal Planner;
- recipes;
- mixed food logs;
- shared progress;
- activity;
- different fitness goals;
- distinct routines;
- at least one low adherence user;
- one high adherence user;
- one new user with sparse history.

No introducir datos médicos sensibles.

---

# 72. Coach Starter demo

## Coach

```text
username: demo.coach.starter
display_name: Juan Acosta
email: demo.coach.starter@nuvia.local
plan: COACH_STARTER
```

Coach personal:

```text
PLUS benefits
```

Coaching Space:

```text
Juan Acosta Coaching
capacity: 10
active athletes seeded: 5
```

---

# 73. Coach Starter athletes

Crear:

```text
demo.athlete.camila    Camila Ríos
demo.athlete.nicolas   Nicolás Vega
demo.athlete.rocio     Rocío Medina
demo.athlete.bruno     Bruno López
demo.athlete.micaela   Micaela Torres
```

Underlying:

```text
FREE unless otherwise specified
```

Effective:

```text
COACH_SPONSORED_ATHLETE
```

---

# 74. Coach Starter athlete personas

## Camila

```text
high adherence
strength/hypertrophy
4 sessions/week
```

## Nicolás

```text
medium adherence
3 sessions/week
occasional missed workouts
```

## Rocío

```text
weight trend decreasing slowly
high step adherence
```

## Bruno

```text
low adherence
Needs Attention candidate
```

## Micaela

```text
new athlete
2 weeks of data
new Strategy recently published
```

---

# 75. Coach Starter coaching data

Crear:

- 5 active relationships;
- strategy manager relation;
- Strategy versions;
- at least 1 draft;
- Coach Notes;
- workout plans;
- nutrition prescriptions;
- progress;
- history;
- PRs;
- audit entries;
- one old accepted invitation;
- one expired invitation to another test profile;
- one cancelled invitation.

---

# 76. Coach Pro demo

## Coach

```text
username: demo.coach.pro
display_name: Marina Quiroga
email: demo.coach.pro@nuvia.local
plan: COACH_PRO
```

Coaching Space:

```text
Marina Performance
capacity: 30
```

Seed:

```text
12 active athletes
```

No es necesario llenar 30 para demo inicial.

Los límites se testean aparte.

---

# 77. Coach Pro athletes

Crear:

```text
demo.pro.agustin
demo.pro.paula
demo.pro.franco
demo.pro.julieta
demo.pro.federico
demo.pro.carolina
demo.pro.mateo
demo.pro.florencia
demo.pro.santiago
demo.pro.milagros
demo.pro.leandro
demo.pro.victoria
```

Display names realistas ficticios.

---

# 78. Coach Pro data diversity

Distribuir:

```text
3 high adherence
4 medium
3 low
2 new
```

Crear:

- 6-month history for some;
- 30-day history for some;
- weight gain/cut/maintenance examples;
- varying steps;
- RPE;
- PRs;
- nutrition adherence;
- Strategy version changes.

---

# 79. Coach Pro features seed

Crear:

```text
5 program templates
4 nutrition templates
6 Coach custom exercises
3 reports
Needs Attention cases
advanced roster analytics
```

Templates ejemplo:

```text
Beginner Full Body
Upper/Lower Intermediate
Push Pull Legs
Strength 4-Day
Deload Week
```

Nutrition:

```text
Maintenance 2200
Cut 2000
Performance 2600
High Protein Base
```

No presentar estos números como prescripción médica.

Son demo.

---

# 80. Cross-role demo

Para probar roles simultáneos:

Hacer que:

```text
demo.coach.starter
```

también sea atleta autorizado de:

```text
demo.coach.pro
```

Así se prueba:

```text
user is Coach
AND
user is Athlete
```

Su personal Strategy puede ser managed por Marina mientras administra sus propios 5 atletas.

Esta prueba es obligatoria.

---

# 81. Edge-case billing users

Crear opcionalmente:

```text
demo.billing.pastdue
demo.billing.cancelled
demo.billing.expired
demo.billing.grace
```

No requieren datasets gigantes.

Sirven para UI/entitlement tests.

---

# 82. Synthetic subscription provider

Antes de Mercado Pago:

```text
provider = 'seed'
```

o:

```text
provider = 'manual'
```

Nunca inventar Mercado Pago IDs.

Los demo entitlements deben probar la misma pipeline.

---

# 83. Seed data — Daily Metrics

Por usuario con history:

```text
steps
calories
body_weight
notes occasionally
```

Generación determinística.

No usar puro random.

Usar tendencia + ruido reproducible.

---

# 84. Seed workout sessions

Generar:

- planned workouts;
- completed;
- occasional abandoned;
- sets;
- actual vs planned;
- varying RPE;
- rest;
- notes;
- PRs.

---

# 85. Seed nutrition

Crear:

- nutrition plan;
- Food Log;
- planned meals;
- recipes;
- grocery impact;
- adherence.

No crear una dieta clínicamente presentada.

---

# 86. Seed Strategy versions

Plus:

```text
4 versions
```

Coach athletes:

```text
3-6 versions depending tenure
```

Incluir:

```text
created_by coach
change_reason
published_at
effective periods
```

---

# 87. Seed invitations

Probar estados:

```text
pending
accepted
declined
cancelled
expired
```

---

# 88. Seed audit

Crear historial suficiente para:

- published Strategy;
- invited athlete;
- removed athlete;
- note created;
- restored Strategy.

---

# 89. Seed script idempotente

Ejecutarlo dos veces no debe duplicar.

Usar:

- stable UUIDs;
- stable external IDs;
- upsert;
- delete/replace sólo dentro del namespace demo controlado.

Nunca borrar usuarios reales.

---

# 90. Demo namespace

Todos los seeds deben identificarse con:

```text
metadata.demo = true
```

o equivalente.

Permitir:

```text
yarn seed:commercial-demo
yarn seed:commercial-demo:reset
```

Reset sólo toca demo data.

---

# 91. db:check comercial

Extender `yarn db:check`.

Validar:

```text
plans
plan_prices
plan_entitlements
subscriptions
effective entitlements
demo users
Couple capacity
Household capacity
Coach Starter
Coach Pro
cross-role user
RLS
```

---

# 92. Test matrix por plan

Crear tests para:

## FREE

- no AI;
- no custom food creation;
- no custom exercise creation;
- history 30 days;
- ads;
- no Household create;
- no Coaching create.

## PLUS

- AI 50;
- custom content;
- no ads;
- full history;
- advanced analytics;
- no Household create.

## COUPLE

Owner:

- Plus;
- create Duo;
- max 2.

Member:

- Plus sponsored;
- no independent household_create.

## HOUSEHOLD

Owner:

- max 5.

Members:

- Plus sponsored.

## Coach Starter

- max 10 active;
- core Coach operations;
- no Pro templates/advanced roster analytics.

## Coach Pro

- max 30;
- templates;
- reports;
- advanced analytics.

---

# 93. Limit tests

Server-side:

```text
Couple member 3 → DENY
Household member 6 → DENY
Coach Starter athlete 11 → DENY
Coach Pro athlete 31 → DENY
```

---

# 94. Expiration tests

When sponsor ends:

- benefits removed;
- data preserved;
- no destructive deletes.

---

# 95. Landing overhaul — objective

La Landing actual ya no representa el producto.

Debe rehacerse para vender:

```text
Personal fitness
Nutrition
Couple/Household
Coaching
Analytics
AI
Cross-platform future
```

No sólo “entrenar juntos”.

---

# 96. Landing positioning

Mensaje central sugerido conceptualmente:

```text
Your training, nutrition and progress.
On your own, together, or with your coach.
```

El copy final debe mantenerse ES/EN.

No usar claims médicos.

---

# 97. Landing Hero

Hero debe mostrar:

- propuesta clara;
- CTA Start Free;
- CTA View plans / See Coaching;
- producto real;
- dashboard/Strategy visual;
- mobile visual cuando esté disponible.

No usar mockups falsos que muestren features inexistentes.

---

# 98. Landing sections

Orden sugerido:

```text
1 Hero
2 Personal training
3 Strategy
4 Live Training
5 Nutrition
6 Progress/analytics
7 Couple + Household
8 Coaching
9 Coach Pro efficiency
10 AI
11 Exercise library
12 Cross-platform
13 Pricing
14 Plan comparison
15 FAQ
16 Final CTA
17 Footer
```

---

# 99. Personal section

Mostrar:

```text
Strategy
Live
Manual
Quick Log
Progress
History
```

---

# 100. Nutrition section

Mostrar:

```text
Food Library
Recipes
Food Log
Meal Planner
Grocery
Insights
```

---

# 101. Couple / Household section

Explicar:

```text
Each person keeps their own data
Share what makes sense
Plan groceries together
Follow progress
```

No prometer acceso irrestricto.

---

# 102. Coaching section

Debe ser protagonista.

Explicar:

```text
Coach manages athlete Strategy
Athlete keeps same app
Workout prescription
Nutrition goals
Progress
History
Notes
Draft / Publish
```

---

# 103. Coach Pro section

Mostrar:

```text
30 athletes
Needs Attention
templates
analytics
reports
```

Sólo si implementado.

---

# 104. Pricing cards

Mostrar:

```text
Free
Plus
Couple
Household
Coach Starter
Coach Pro
```

Usar monthly/annual toggle.

Annual:

```text
2 months equivalent free
```

---

# 105. Pricing hierarchy

Visual groups:

```text
PERSONAL
Free
Plus

TOGETHER
Couple
Household

PROFESSIONAL
Coach Starter
Coach Pro
```

Esto reduce confusión.

---

# 106. Pricing CTA

Free:

```text
Start free
```

Plus etc:

si no autenticado:

```text
Create account
→ preserve selected plan
→ login/signup
→ checkout
```

Si autenticado:

```text
Choose plan
→ billing checkout
```

---

# 107. No fake testimonials

No inventar:

- customer counts;
- reviews;
- star ratings;
- testimonials;
- gyms;
- professional clients.

Hasta tener datos reales.

---

# 108. Real demo screenshots

Usar los nuevos seed users para generar UI con datos ricos.

La Landing puede mostrar screenshots reales o componentes recreados fielmente.

No exponer emails demo ni internal IDs.

---

# 109. Responsive

Landing debe ser excelente en:

```text
mobile
tablet
desktop
```

---

# 110. Performance

- lazy media;
- no heavy videos above fold;
- optimize images;
- preserve Core Web Vitals;
- avoid huge JS bundles.

---

# 111. SEO

Agregar:

- title;
- description;
- OG;
- structured metadata where appropriate;
- canonical;
- favicon;
- social preview;
- ES/EN localized metadata si la arquitectura lo soporta.

---

# 112. Billing foundation — cuándo comenzar

Sólo después de que:

```text
entitlements
feature gates
plan tests
demo users
landing pricing
```

funcionen sin Mercado Pago.

El sistema debe poder simular paid state con `seed`.

---

# 113. Mercado Pago — decisión inicial

Usar:

```text
Mercado Pago Subscriptions
```

con integración programática.

Preferir:

```text
associated subscription plans
```

para los planes mensuales/anuales.

Conceptualmente:

```text
internal plan_price
↔
Mercado Pago preapproval_plan
```

---

# 114. Mercado Pago plan mapping

Agregar:

```text
billing_provider_prices
--------------------------------
id
plan_price_id
provider
provider_plan_id
environment
active
created_at
updated_at
```

Provider:

```text
mercadopago
```

Environment:

```text
test
production
```

---

# 115. No hardcodear Mercado Pago Plan IDs

Nunca:

```ts
const PLUS_MP_PLAN = 'abc123'
```

en componentes.

Guardar en DB/config server-side.

---

# 116. Mercado Pago credentials

Separar:

```text
test
production
```

Secret:

```text
MERCADOPAGO_ACCESS_TOKEN
```

Sólo backend/Edge Functions.

Public Key únicamente si la integración seleccionada realmente la necesita en frontend.

No exponer Access Token.

---

# 117. Environment variables

Sugeridas:

```text
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_WEBHOOK_SECRET
MERCADOPAGO_ENVIRONMENT
APP_PUBLIC_URL
BILLING_RETURN_URL
```

Confirmar nombres según implementación real.

No versionar secretos.

---

# 118. Supabase Edge Functions

Crear:

```text
billing-create-checkout
billing-get-status
billing-cancel-subscription
billing-sync-subscription
mercadopago-webhook
```

Opcional:

```text
billing-change-plan
```

en fase posterior.

---

# 119. Create checkout flow

```text
Authenticated user
↓
select plan + interval
↓
Edge Function
↓
validate internal plan
↓
validate eligibility
↓
create local checkout intent
↓
resolve Mercado Pago provider plan
↓
create preapproval/subscription
↓
save provider subscription reference
↓
return provider redirect URL
↓
browser redirects to Mercado Pago
```

---

# 120. `external_reference`

Usar un ID interno seguro.

Ejemplo:

```text
billing_checkout_intent.id
```

No usar:

```text
plan=plus&user=uuid
```

como única validación.

---

# 121. Checkout intents

Tabla sugerida:

```text
billing_checkout_intents
--------------------------------
id
user_id
plan_price_id
provider
status
provider_reference nullable
expires_at
created_at
updated_at
```

Status:

```text
created
redirected
completed
failed
expired
```

---

# 122. Return URL

Después de Mercado Pago:

```text
/app/billing/return
```

Nunca activar plan basándose en query string.

Mostrar:

```text
Confirming subscription...
```

Consultar estado interno.

---

# 123. Webhook authoritative flow

```text
Mercado Pago
↓
webhook
↓
validate origin according to current MP subscription docs
↓
parse topic/resource ID
↓
fetch authoritative resource from Mercado Pago API
↓
map state
↓
idempotent DB transaction
↓
subscription
↓
entitlements
```

No confiar solamente en payload recibido.

---

# 124. Mercado Pago topics

Preparar manejo para los topics que corresponden a Suscripciones:

```text
subscription_preapproval
subscription_authorized_payment
payment
```

Y cuando se administren provider plans:

```text
subscription_preapproval_plan
```

Revalidar documentación oficial en el momento de implementación.

---

# 125. Mercado Pago test mode

Usar credenciales de prueba.

No cobrar dinero real.

Mercado Pago test users son DISTINTOS de usuarios Supabase demo.

No intentar replicar todos los usuarios app en Mercado Pago.

Para payment tests bastan las cuentas test requeridas por MP.

---

# 126. Idempotency

Cada webhook/evento debe poder llegar múltiples veces.

Resultado:

```text
same final state
```

No:

- subscriptions duplicadas;
- entitlement grants duplicados;
- emails duplicados;
- audit duplicates.

---

# 127. Internal subscription statuses

Canonical:

```text
pending
active
past_due
paused
canceled
expired
```

Opcional:

```text
trialing
grace
```

---

# 128. Mapping Mercado Pago

Ejemplo conceptual:

```text
authorized → active
paused → paused
canceled → canceled
```

Payment failures pueden producir:

```text
past_due
```

aunque provider preapproval siga autorizado.

No hardcodear sin leer resource completo.

---

# 129. Grace period

Configurable:

```text
3 days
```

Inicial sugerido.

Cuando recurring payment falla:

```text
active
→ past_due/grace
```

Mantener acceso temporal.

Si recupera:

```text
→ active
```

Si no:

```text
→ suspended effective entitlements
```

---

# 130. Payment retries

Mercado Pago soporta reintentos automáticos en suscripciones.

No crear un segundo motor de retry de cobro sin necesidad.

Nuestra responsabilidad:

```text
listen
sync
communicate state
```

---

# 131. Cancel subscription

V1:

Permitir cancelación desde:

```text
/app/billing
```

Mostrar consecuencias.

No borrar datos.

Si Mercado Pago cancellation es inmediata en el flujo elegido, reflejarlo claramente.

Una experiencia de “cancel at period end” puede agregarse cuando se implemente de forma fiable.

No simularla sin backend scheduler real.

---

# 132. Plan upgrades/downgrades

No implementar proration complejo en primera versión si Mercado Pago workflow no lo resuelve limpiamente.

V1 puede:

```text
new subscription effective next cycle
```

o flujo seguro documentado.

Nunca:

```text
change local entitlement first
then hope payment works
```

---

# 133. Duplicate active subscriptions

Server debe impedir:

```text
two active paid personal subscriptions
```

para el mismo billing scope.

Inicialmente:

```text
one active commercial plan per owner
```

---

# 134. Household + Coach add-on

NO implementar add-on aún.

Aunque conceptualmente puede existir:

```text
Coach + Household
```

la arquitectura de entitlements debe permitir futuros add-ons.

No acoplar el modelo a “un plan = todas las capabilities posibles para siempre”.

---

# 135. Billing screen

Crear:

```text
/app/billing
```

Mostrar:

- current plan;
- status;
- billing interval;
- price;
- next date if known;
- entitlement summary;
- usage;
- manage/cancel;
- upgrade options.

---

# 136. AI usage display

Plus:

```text
20 / 50 interactions used
```

Coach Pro:

mostrar personal y coach quota separadas si se implementan como métricas diferentes.

---

# 137. Seat usage display

Coach:

```text
5 / 10 athletes
```

Pro:

```text
12 / 30 athletes
```

Household:

```text
4 / 5 members
```

Couple:

```text
2 / 2
```

---

# 138. Billing RLS

Usuario sólo puede leer su billing summary.

No permitir UPDATE directo a:

```text
subscriptions
subscription_events
provider mappings
entitlement grants from billing
```

desde frontend.

Mutaciones mediante RPC/Edge Function.

---

# 139. Webhook service role

Webhook Edge Function puede usar service role server-side.

Nunca browser.

Validar payload antes de mutar.

---

# 140. Reconciliation job

Crear una función manual/admin:

```text
billing-reconcile
```

que compare:

```text
internal subscriptions
vs
Mercado Pago
```

Para recuperar inconsistencias.

Puede evolucionar a cron.

---

# 141. Billing audit

Registrar:

```text
checkout_created
subscription_activated
payment_approved
payment_failed
subscription_paused
subscription_canceled
grace_started
entitlements_changed
```

---

# 142. Mercado Pago sandbox Definition of Done

Debe probar:

```text
Plus monthly
Plus annual
Couple
Household
Coach Starter
Coach Pro
```

Al menos un happy path por tipo de precio.

Además:

- rejected payment;
- duplicate webhook;
- cancel;
- payment retry/sync;
- expired return page;
- unauthorized checkout.

---

# 143. Web billing CTA

Landing:

```text
Choose Plus
```

→ login/signup preserving:

```text
plan
interval
```

→ checkout.

Después:

```text
return
→ billing status
→ app
```

---

# 144. Mobile architecture

Mobile consume:

```text
same Supabase
same entitlements
same subscription state
```

No crear billing logic paralela.

---

# 145. Store policy guardrail

Nuvia vende funcionalidades digitales/SaaS.

Por lo tanto:

- no asumir que Mercado Pago puede mostrarse como checkout dentro de iOS;
- no asumir que Mercado Pago puede reemplazar Google Play Billing dentro de Android distribuido por Play;
- revisar reglas actuales antes de release.

---

# 146. iOS initial strategy

Primera estrategia segura:

```text
mobile app = companion app
```

Usuario puede:

- log in;
- consumir entitlements ya adquiridos;
- usar features.

No incluir automáticamente un botón Mercado Pago externo dentro del build App Store.

Si se quiere vender dentro de iOS:

```text
StoreKit / In-App Purchase
```

debe evaluarse/implementarse según reglas vigentes.

---

# 147. Android initial strategy

Google Play normalmente requiere Play Billing para subscriptions digitales compradas dentro de la app, salvo programas/excepciones aplicables.

Primera versión:

- consumir entitlements existentes;
- no integrar Mercado Pago nativo sin revisión de política;
- dejar billing provider abstraction preparada para Google Play.

---

# 148. Platform billing abstraction futura

Internal:

```text
provider:
seed
mercadopago
apple
google_play
stripe
```

La app sigue preguntando:

```text
effective entitlements
```

---

# 149. Mobile billing screen

Puede mostrar:

```text
Current plan
Benefits
Usage
Status
```

CTA de compra debe depender de:

```text
platform
storefront
remote policy config
build channel
```

No hardcodear external URL.

---

# 150. Landing / web checkout sí usa Mercado Pago

La web será el canal inicial de adquisición paga.

Mercado Pago:

```text
web billing provider
```

---

# 151. Emails

Si todavía no existe infraestructura transaccional, no bloquear MVP de billing por email custom.

Preparar eventos internos para futuro:

```text
subscription activated
payment failed
cancelled
```

---

# 152. Analytics de negocio

Instrumentar eventos:

```text
pricing_viewed
plan_selected
checkout_started
checkout_redirected
subscription_activated
checkout_failed
plan_cancelled
upgrade_prompt_viewed
upgrade_prompt_clicked
feature_blocked
```

No enviar secretos ni información sensible.

---

# 153. Conversion tracking

Necesitamos saber:

```text
Free → Plus
Free → Couple
Free → Household
Free → Coach
```

sin mezclar con health data.

---

# 154. Ads metrics

Separadas de health:

```text
ad_impression
ad_click
```

No asociar targeting con peso/nutrición.

---

# 155. Landing plan comparison table

Filas sugeridas:

```text
Personal training
Nutrition
History
Analytics
AI
Custom foods
Custom exercises
Ads
Members
Household
Athletes
Coach Strategy
Coach Notes
Templates
Reports
```

No mostrar 50 filas en móvil; usar accordion.

---

# 156. Pricing copy

## Free

```text
Everything you need to start.
```

## Plus

```text
Go deeper into your own progress.
```

## Couple

```text
Train together, keep your own journey.
```

## Household

```text
One plan for the people you share life with.
```

## Coach Starter

```text
Manage your athletes from one place.
```

## Coach Pro

```text
Scale your coaching without multiplying admin work.
```

Copy final deberá revisarse en ES/EN.

---

# 157. Upgrade UX

No modal agresivo cada vez.

Mostrar upsell contextual.

Ejemplo:

User Free toca 90 days:

```text
90-day analytics are included with Plus.
```

CTA:

```text
See Plus
```

---

# 158. No dark patterns

No:

- countdown fake;
- false discounts;
- hidden cancellation;
- preselected annual misleadingly;
- fake scarcity.

---

# 159. Current plan marker

Pricing:

```text
Current plan
```

para usuario logueado.

---

# 160. Sponsored user marker

Couple/Household member:

```text
Plus benefits provided by Household
```

Coach athlete:

```text
Coaching access provided by Juan Acosta Coaching
```

No confundir con paid subscription propia.

---

# 161. Subscription owner

Billing screen debe distinguir:

```text
Own subscription
```

vs:

```text
Sponsored benefits
```

---

# 162. Account deletion

No implementar sin revisar billing.

Si user tiene paid subscription:

- advertir;
- cancelar/resolve provider;
- preserve legal records;
- then deletion flow.

No borrar billing history indiscriminadamente.

---

# 163. Plan catalog source of truth

Landing, billing y app deben leer:

```text
plan catalog
```

desde configuración compartida/API.

No tres listas distintas.

---

# 164. Price caching

Frontend puede cachear.

Pero checkout Edge Function debe volver a resolver precio server-side.

Nunca confiar en:

```text
amount from client
```

---

# 165. Server checkout payload

Client envía:

```text
planCode
billingInterval
```

No:

```text
amount=7990
```

Servidor calcula.

---

# 166. Mercado Pago plan provisioning

Crear script admin:

```text
yarn billing:mp:sync-plans
```

Responsabilidad:

- leer internal active prices;
- encontrar/create provider plan;
- persist mapping;
- no duplicar;
- no modificar production destructive sin explicit flag.

---

# 167. Production plan price changes

No mutar históricamente precios viejos.

Crear nuevo `plan_price`.

Old subscriptions mantienen snapshot.

---

# 168. Price display

Mostrar:

```text
ARS canonical
```

La referencia USD puede ser marketing internacional más adelante.

No calcular precio checkout mediante FX live.

---

# 169. Taxes

No hardcodear tax assumptions en el engine sin asesoría contable.

Guardar gross provider data.

Facturación fiscal argentina será un dominio aparte si luego se integra ARCA.

---

# 170. Mercado Pago fees

No restar fees en entitlement logic.

Usuario obtiene plan según payment status, no net settlement.

---

# 171. Refunds/chargebacks

Diseñar events, aunque UI puede quedar posterior.

Si provider notifica refund/chargeback relevante:

- registrar;
- revisar entitlement policy;
- no borrar datos.

---

# 172. Security

Nunca loguear:

- Access Token;
- card token;
- full payment credentials;
- webhook secret;
- auth password.

---

# 173. Demo password logging

El seed puede usar password conocida.

No imprimirla repetidamente en logs.

Mostrar sólo:

```text
Demo password configured.
```

La documentación interna puede indicar la password solicitada.

---

# 174. Mercado Pago test cards

Usar únicamente la documentación/test environment actual.

No guardar números test como constantes de producción.

---

# 175. Test isolation

E2E billing:

```text
sandbox/test
```

Nunca producción en CI.

---

# 176. RLS integration test matrix

Actor:

```text
Free
Plus
Couple owner
Couple member
Household owner
Household member
Coach Starter
Coach Pro
Coach athlete
cross-role
random user
revoked coach
```

Resource:

```text
profile
Strategy
workout
nutrition
history
custom food
custom exercise
household
coaching
billing
```

Actions:

```text
read
create
update
delete
publish
invite
export
```

---

# 177. Entitlement test examples

```text
Free create custom food → DENY
Plus create custom food → ALLOW
Household sponsored member → ALLOW
Coach-sponsored-only athlete → DENY
```

---

# 178. AI test examples

```text
Free → DENY
Plus 49/50 → ALLOW
Plus 50/50 → DENY
new billing period → reset
```

---

# 179. Coach seat tests

```text
Starter 9 → invite/accept ALLOW
Starter 10 → next accept DENY
Pro 29 → ALLOW
Pro 30 → DENY
```

---

# 180. Membership benefit tests

Member leaves Couple:

```text
sponsored Plus removed
```

Own subscription Plus, if any:

```text
remains
```

---

# 181. Coaching sponsorship tests

Athlete removed:

```text
Coach sponsored ad-free removed
```

Own Plus:

```text
continues
```

---

# 182. Cross-role tests

`demo.coach.starter`:

```text
personal Strategy managed by Coach Pro
AND
manages own athletes
```

Verify no privilege bleed.

---

# 183. E2E — Free to Plus

```text
login Free
attempt 90-day Progress
blocked
choose Plus
sandbox checkout
webhook active
refresh entitlements
90-day available
ads hidden
AI available
custom food available
```

---

# 184. E2E — Couple

```text
owner subscribes Couple
creates Duo
invites member
member accepts
member gets Plus sponsored
capacity blocks third
```

---

# 185. E2E — Household

Same with 5 total.

---

# 186. E2E — Coach Starter

```text
subscribe
Coach tab active
invite athlete
accept
publish Strategy
athlete sees it
athlete no ads
athlete executes
coach sees result
```

---

# 187. E2E — Coach Pro

```text
templates
assign
Needs Attention
report
30 seat enforcement
```

---

# 188. E2E — cancellation

```text
active subscription
cancel
provider webhook
internal update
entitlements downgrade
data preserved
```

---

# 189. Realtime

Subscription/entitlement changes deben refrescar UI.

No requerir logout/login.

---

# 190. Realtime billing

No es obligatorio publicar todas las tablas billing directamente.

Puede:

- refetch after checkout;
- refetch on app focus;
- server event/invalidation.

Evitar exponer raw billing events por Realtime.

---

# 191. Error states billing

Diferenciar:

```text
checkout unavailable
provider unavailable
payment pending
payment rejected
subscription paused
subscription canceled
sync pending
configuration missing
```

---

# 192. Feature unavailable by plan

No usar:

```text
Something went wrong
```

Usar:

```text
This feature is available with Plus.
```

---

# 193. Payment pending

No habilitar premium hasta estado autorizado/activo definido.

Mostrar:

```text
Payment is still being confirmed.
```

---

# 194. Provider outage

No revocar entitlements existentes sólo porque Mercado Pago API no responde temporalmente.

Usar last known authoritative state.

---

# 195. Webhook timeout

Responder rápidamente según contrato.

Procesamiento pesado puede desacoplarse si infraestructura lo requiere.

Pero no perder evento.

---

# 196. Database transaction

Webhook processing:

```text
event insert/idempotency
subscription update
entitlement update
audit
```

en transacción cuando sea posible.

---

# 197. Observability

Logs estructurados:

```text
billing_event_id
provider
topic
provider_resource_id
internal_subscription_id
result
duration
```

Sin PII innecesaria.

---

# 198. Admin diagnostics

Crear una vista/script interna:

```text
billing status by user
effective entitlements
provider mapping
last events
```

No exponer a usuarios.

---

# 199. Feature flag Mercado Pago

```text
BILLING_MERCADOPAGO_ENABLED
```

Permite deploy schema/UI antes de habilitar checkout.

---

# 200. Feature flag ads

```text
ADS_ENABLED
```

Además de entitlement.

---

# 201. Feature flag Coach Pro

Si analytics/templates no están completos:

```text
COACH_PRO_PUBLIC=false
```

No vender plan hasta Definition of Done.

---

# 202. No vender feature inexistente

Landing debe leer availability.

No mostrar como incluido algo que todavía está feature-flagged off para producción.

---

# 203. Release staging

Orden:

```text
DB migration
seed staging
feature tests
landing staging
Mercado Pago sandbox
E2E
production schema
production provider plans
production webhook
billing flag ON
```

---

# 204. Mercado Pago production checklist

Antes de activar:

- seller account verified;
- app created;
- production credentials;
- HTTPS;
- correct return URL;
- webhook configured;
- plans synced;
- reconciliation;
- monitoring;
- support flow.

---

# 205. Mobile release checklist

Antes de store release:

- entitlements work;
- no unauthorized external checkout CTA;
- restore access works;
- subscription state works after login;
- privacy copy;
- ads consent;
- deep links reviewed;
- store policy review.

---

# 206. Documentación

Actualizar:

```text
DOCUMENTACION_TECNICA.md
REMAINING_WORK_AND_DECISIONS.md
COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md
BILLING_ARCHITECTURE.md
MERCADOPAGO_INTEGRATION.md
DEMO_USERS.md
LANDING_PRODUCT_MAP.md
```

`DEMO_USERS.md` puede documentar usernames y la password de entorno demo, pero debe indicar claramente que no son cuentas productivas.

---

# 207. README

Agregar comandos:

```text
yarn seed:commercial-demo
yarn db:check
yarn billing:mp:sync-plans
```

si esos scripts finalmente adoptan esos nombres.

---

# 208. CI

Agregar:

```text
lint
typecheck
unit tests
RLS integration tests
build
```

Billing sandbox E2E puede ejecutarse en pipeline separado debido a dependencia externa.

---

# 209. Definition of Done — Plans

No considerar listo hasta que:

- plan catalog existe;
- entitlements son server-side;
- plan UI usa source of truth;
- Free limits reales;
- Plus benefits reales;
- Couple sponsors Plus;
- Household sponsors Plus;
- Coach Starter completo;
- Coach Pro features implementadas antes de vender;
- seat limits server-side.

---

# 210. Definition of Done — Demo

Debe poder loguearse con cada usuario demo y observar diferencias reales.

No simplemente labels.

Ejemplo:

```text
demo.free
```

debe comportarse distinto de:

```text
demo.plus
```

---

# 211. Definition of Done — Landing

La Landing debe reflejar:

- training;
- nutrition;
- together;
- household;
- coaching;
- analytics;
- AI;
- pricing real.

No debe seguir pareciendo un producto limitado a una pareja.

---

# 212. Definition of Done — Mercado Pago

```text
Landing plan CTA
→ auth
→ checkout
→ Mercado Pago sandbox
→ webhook
→ internal subscription active
→ entitlements active
→ UI refresh
```

y cancelación/sync funcionan.

---

# 213. Definition of Done — Mobile

Mobile:

```text
login same user
→ reads same entitlements
→ correct features enabled
```

sin duplicar purchase authority.

---

# 214. No hacer

Los agentes NO deben:

- integrar Mercado Pago antes de entitlements;
- habilitar plan por redirect URL;
- confiar en amount del frontend;
- poner Access Token en Vite/Expo;
- usar service role en browser;
- hardcodear plan IDs externos;
- duplicar product logic web/mobile;
- crear global `isCoach`;
- crear global `isPremium`;
- ocultar features sólo con CSS;
- borrar datos por downgrade;
- borrar Strategy por Coach cancellation;
- dar Plus completo a Coach-sponsored athlete si no se decidió;
- dar household_create a sponsored members;
- vender Coach Pro sin features Pro;
- mostrar Studio como disponible;
- ejecutar demo seed en producción;
- usar la password demo para usuarios reales;
- inventar Mercado Pago production data;
- integrar Mercado Pago dentro de iOS/Android sin store-policy review;
- usar datos de salud para ad targeting;
- inventar testimonios en Landing.

---

# 215. Primer entregable técnico

Antes de modificar el producto, entregar:

```text
docs/COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md
```

con:

```text
Feature
Current state
Plan(s)
Missing backend
Missing frontend
RLS impact
Migration
Tests
Risk
Dependency
```

---

# 216. Segundo entregable

Crear:

```text
docs/BILLING_ARCHITECTURE.md
```

antes de Mercado Pago.

Debe contener:

- schema;
- PlanCode;
- plan price model;
- entitlement resolution;
- sponsorship;
- subscription states;
- grace;
- lifecycle;
- provider abstraction;
- Mercado Pago mapping;
- mobile policy boundaries.

---

# 217. Tercer entregable

Crear:

```text
docs/DEMO_USERS.md
```

Tabla:

```text
username
display name
plan
relationship
expected capabilities
dataset
password environment
```

---

# 218. Cuarto entregable

Crear:

```text
docs/LANDING_PRODUCT_MAP.md
```

Mapear cada sección Landing a una feature realmente implementada.

---

# 219. Quinto entregable

Crear:

```text
docs/MERCADOPAGO_INTEGRATION.md
```

Documentar:

- app Mercado Pago;
- credentials;
- sandbox;
- preapproval plans;
- subscriptions;
- return;
- webhooks;
- topics;
- internal mapping;
- cancellation;
- errors;
- reconciliation;
- production checklist.

---

# 220. Criterio de ejecución de agentes

No quedarse solamente en documentos.

Después de cada análisis:

```text
implement
migrate
seed
test
document
```

Iterar por fases pequeñas.

---

# 221. Comandos obligatorios al cerrar cada fase

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

Agregar suites nuevas conforme se implementen.

---

# 222. Source of truth final

La arquitectura resultante debe cumplir:

```text
Plan
  ↓
Price
  ↓
Subscription
  ↓
Entitlement
  ↓
Effective Capability
  ↓
Domain authorization
  ↓
UI
```

Household membership:

```text
Membership
  ↓
Sponsored Plus bundle
```

Coaching athlete:

```text
Active relationship
  ↓
Sponsored athlete bundle
```

Mercado Pago:

```text
Provider event
  ↓
Internal subscription
  ↓
Entitlements
```

---

# 223. Resultado final esperado

El sistema deberá permitir demostrar, sin modificar código manualmente:

```text
Free user
Plus user
Couple owner/member
Household owner/members
Coach Starter
Coach Starter athletes
Coach Pro
Coach Pro athletes
Coach who is also athlete
expired/past-due/cancelled billing states
```

Cada uno debe experimentar una aplicación distinta únicamente por:

```text
effective entitlements
relationships
memberships
```

y no por hacks de UI.

---

# 224. Principio comercial final

La estructura debe expresar claramente:

```text
PERSONAL
Free
→ Plus

TOGETHER
Couple
→ Household

PROFESSIONAL
Coach Starter
→ Coach Pro
→ Future Studio
```

Y cada salto responde a una necesidad real:

```text
Free → Plus
I want more for myself.

Plus → Couple
I want to share with my partner.

Couple → Household
We are more people.

Free/Plus → Coach Starter
I work as a coach.

Starter → Pro
I have more athletes and need operational efficiency.

Pro → Studio
We are becoming an organization.
```

---

# 225. Principio técnico final

Nunca construir Billing como un conjunto de botones de pago.

Construir primero un **sistema de producto y autorización**.

Mercado Pago se conecta después como proveedor de cobro.

La web será el primer canal de checkout.

Las aplicaciones mobile consumirán los mismos entitlements y sólo ofrecerán compras externas o nativas de acuerdo con las políticas vigentes de App Store y Google Play.

El proyecto debe quedar preparado para que, en el futuro, se pueda agregar:

```text
Apple
Google Play
Stripe
another provider
```

sin rediseñar planes, roles, Strategy, Household o Coaching.

---

# 226. Inicio inmediato de trabajo

Los agentes deben comenzar por:

```text
1. Inspect current schema and code.
2. Create COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md.
3. Freeze canonical PlanCode + entitlements.
4. Implement plan/entitlement foundation.
5. Seed the first Free and Plus accounts.
6. Prove different permissions.
7. Complete Couple/Household sponsorship.
8. Finish Coach Starter.
9. Finish Coach Pro.
10. Build all demo personas.
11. Rebuild Landing.
12. Integrate Mercado Pago sandbox.
13. Execute complete E2E.
14. Only then prepare production billing.
```

No comenzar por el checkout.

El checkout es la última conexión de una arquitectura que primero debe ser capaz de responder correctamente:

> **¿Qué puede hacer este usuario, por qué puede hacerlo, quién se lo está patrocinando y qué pasa con sus datos cuando deja de tener ese derecho?**

Cuando esa respuesta sea consistente en DB, RLS, RPC, frontend web y mobile, el sistema estará listo para cobrar.

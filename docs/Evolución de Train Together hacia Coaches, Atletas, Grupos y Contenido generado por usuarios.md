# TRAIN TOGETHER — EVOLUCIÓN HACIA COACHING, ATHLETES, GRUPOS Y USER-GENERATED CONTENT

## 0. CONTEXTO Y OBJETIVO GENERAL

Estamos evolucionando Train Together desde una aplicación de fitness inicialmente orientada a parejas/duplas y hogares hacia una plataforma más general de entrenamiento, nutrición y seguimiento colaborativo.

El producto debe continuar soportando perfectamente los casos de uso actuales:

- pareja / duo;
- grupo familiar / household;
- seguimiento y progreso compartido;
- planificación de entrenamiento;
- nutrición;
- Meal Planner;
- Grocery List;
- Food Log;
- métricas;
- historial;
- Live Training;
- progreso y PRs;
- perfiles públicos;
- descubrimiento de usuarios.

Pero debemos agregar un nuevo caso de uso de primer nivel:

> **Personal Trainer / Coach → múltiples Athletes**

Un entrenador deberá poder crear un espacio profesional de coaching, agregar múltiples alumnos/deportistas, asignarles planes de entrenamiento y nutrición, observar su adherencia y progreso, modificar sus planes y administrar todos sus atletas desde una interfaz centralizada.

El atleta, por otro lado, continúa teniendo su propia cuenta y experiencia completa de usuario. El entrenador no debe convertirse en "dueño" de la cuenta personal del atleta. Debe existir una separación clara entre:

1. identidad del usuario;
2. pertenencia a grupos;
3. relación coach-athlete;
4. permisos;
5. ownership de datos;
6. suscripción/licencia;
7. contenido propio;
8. contenido compartido;
9. contenido público.

La implementación debe ser una evolución de la arquitectura existente, no un sistema paralelo.

---

# 1. SOURCE OF TRUTH DEL PROYECTO ACTUAL

Antes de modificar código, leer y respetar completamente:

- `DOCUMENTACION_TECNICA.md`
- `TRAIN_TOGETHER_IMPLEMENTATION_PLAN_REFINED.md`
- `TRAIN_TOGETHER_MONETIZATION_FOUNDATION_PROMPT.md`
- `initial-prompt.md`
- `new_features.md`

La documentación actual indica que:

- React 19 + Vite 6 + TypeScript 5.7 son el stack principal;
- Supabase/PostgreSQL es el backend;
- Supabase Auth maneja autenticación;
- RLS es parte fundamental de la seguridad;
- Realtime ya está implementado;
- `FitnessContext` centraliza el estado de dominio;
- `repository.ts` abstrae persistencia;
- `households/household_members` reemplazaron al modelo runtime de `couples/couple_members`;
- `couples/couple_members` deben considerarse legacy;
- Nutrition ya utiliza `household_id`;
- existen planes de entrenamiento, sesiones, series, métricas, PRs, Food Log, Meal Planner, Grocery List, Recipes e Insights;
- existen perfiles públicos, handles y códigos públicos;
- la monetización todavía no está realmente implementada.





No asumir que las funcionalidades documentadas como "planned", "partial", "legacy" o "future" están realmente implementadas.

---

# 2. PRINCIPIO ARQUITECTÓNICO FUNDAMENTAL

## NO modelar Coach como simplemente otro Household Role

No convertir la solución en:

```text
household
 ├── owner
 ├── member
 └── trainer
```

Esto sería demasiado rígido y generaría problemas futuros.

La nueva arquitectura debe tratar los grupos como espacios de colaboración genéricos.

Conceptualmente:

```text
User
 │
 ├── owns Groups
 │
 ├── belongs to Groups
 │
 ├── follows Users
 │
 └── has Relationships with Users
```

Y:

```text
Group / Workspace
 ├── members
 ├── roles
 ├── permissions
 ├── billing
 └── domain configuration
```

La relación Coach → Athlete debe existir separadamente:

```text
Coach
   │
   ├── Athlete A
   ├── Athlete B
   ├── Athlete C
   └── Athlete D
```

No asumir que:

```text
member of same group = coach relationship
```

porque no necesariamente es cierto.

---

# 3. NUEVO MODELO DE GRUPOS

Evolucionar conceptualmente `households` hacia una entidad más general.

La implementación puede:

### Opción recomendada

Introducir una entidad genérica:

```text
spaces
```

o

```text
workspaces
```

manteniendo compatibilidad/migración desde `households`.

No crear un sistema totalmente independiente para entrenadores.

El objetivo final debería ser:

```text
spaces
```

con:

```text
type:
  duo
  household
  coaching
  future...
```

Ejemplo:

```text
spaces
------------------------------------------------
id
owner_user_id
name
type
max_members
status
created_at
updated_at
metadata
```

Tipos iniciales:

```text
duo
household
coaching
```

En el futuro se debe poder agregar fácilmente:

```text
gym
team
club
studio
organization
academy
```

sin rehacer toda la arquitectura.

---

# 4. MIGRACIÓN DESDE HOUSEHOLDS

Actualmente:

```text
households
household_members
household_invitations
```

son parte central de la aplicación.

No eliminarlos abruptamente.

Diseñar una migración segura.

La estrategia recomendada:

```text
legacy couples
       ↓
households
       ↓
generic spaces
```

Mantener:

```text
couples
couple_members
```

como legacy solamente.

La documentación ya establece que el modelo canónico futuro debe ser `households/household_members`, dejando `couples/couple_members` como legacy.

Los agentes deben inspeccionar las migraciones actuales antes de decidir si:

1. renombrar `households` a `spaces`;
2. introducir `spaces` y mantener `households` como compatibility layer;
3. extender `households` temporalmente.

Elegir la alternativa que produzca menor deuda técnica y mejor capacidad de evolución.

---

# 5. MEMBERSHIP

Crear un modelo genérico:

```text
space_members
```

Conceptualmente:

```text
space_members
------------------------------------------------
id
space_id
user_id
role
status
joined_at
left_at
created_at
updated_at
```

Roles iniciales:

```text
owner
coach
athlete
member
admin
```

No todos los tipos de Space deben permitir todos los roles.

Por ejemplo:

### DUO

```text
owner
member
```

### HOUSEHOLD

```text
owner
member
```

### COACHING

```text
owner
coach
athlete
```

Podrían existir assistants posteriormente:

```text
assistant_coach
```

No implementar roles innecesarios ahora salvo que la arquitectura los soporte limpiamente.

---

# 6. IMPORTANTE: LOS USUARIOS DEBEN PODER PERTENECER A MÚLTIPLES ESPACIOS

No asumir:

```text
1 user = 1 group
```

Debe permitirse:

```text
User
 ├── Family Household
 ├── Personal Coaching Group
 └── Future Gym
```

Esto es importante tanto arquitectónicamente como comercialmente.

Ejemplo real:

```text
Facundo
 ├── Household "Familia"
 └── Coaching Space "Facundo Fitness Coaching"
```

Un atleta podría tener:

```text
Athlete
 ├── Household "My Family"
 ├── Coach "Juan Fitness"
 └── Team "Football Club"
```

Nunca utilizar la pertenencia a un único grupo como mecanismo global de autorización.

---

# 7. COACH-ATHLETE RELATIONSHIP

Crear una entidad explícita.

Ejemplo:

```text
coach_athlete_relationships
------------------------------------------------
id
coach_user_id
athlete_user_id
space_id
status
started_at
ended_at
created_at
updated_at
```

Estados:

```text
pending
active
paused
revoked
ended
```

La relación debe pertenecer a un Coaching Space.

Ejemplo:

```text
Coach Juan
       │
       ▼
Coaching Space "Juan Performance"
       │
       ├── Athlete A
       ├── Athlete B
       └── Athlete C
```

Esto permitirá posteriormente:

- mover atletas;
- suspender una relación;
- terminar una relación;
- reactivar;
- cambiar de entrenador;
- tener asistentes;
- múltiples entrenadores;
- historial.

---

# 8. NO USAR EL ROL COMO ÚNICA CAPA DE PERMISOS

Los permisos deben ser explícitos.

Crear un permission model extensible.

Ejemplo conceptual:

```text
coach_permissions
```

o un sistema equivalente.

Permisos iniciales:

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
view_grocery
view_notes
edit_notes
manage_athlete
remove_athlete
```

No todos deben implementarse obligatoriamente como filas individuales si una matriz declarativa es mejor.

La arquitectura debe evitar hardcodear:

```ts
if (role === "coach") allowEverything()
```

Eso sería inseguro.

---

# 9. MATRIZ DE PERMISOS

## ATHLETE

El atleta siempre conserva ownership de su identidad.

### Puede:

- editar su perfil;
- editar sus métricas personales;
- registrar entrenamientos;
- completar Live Training;
- registrar series;
- consultar historial;
- consultar PRs;
- consultar su progreso;
- consultar dieta asignada;
- consultar Meal Planner;
- utilizar Food Log;
- planificar compras;
- consultar Grocery List;
- crear contenido propio;
- controlar privacidad;
- salir de un Coaching Space;
- aceptar/rechazar relaciones cuando corresponda.

### No puede:

- editar unilateralmente el plan de otro atleta;
- modificar datos de otro usuario;
- administrar el espacio del entrenador;
- acceder a otros atletas;
- ver datos privados de otros atletas.

---

# 10. COACH

El coach puede administrar a los atletas que estén bajo su relación activa y únicamente dentro de sus permisos.

### Puede visualizar:

- perfil del atleta;
- entrenamiento planificado;
- entrenamiento completado;
- sesiones;
- series;
- volumen;
- adherencia;
- PRs;
- RPE;
- sensaciones;
- métricas;
- peso;
- pasos;
- progreso;
- nutrición;
- Food Log cuando el atleta haya concedido ese permiso;
- Meal Planner;
- cumplimiento nutricional;
- notas de coaching.

### Puede editar:

- entrenamiento;
- días de entrenamiento;
- ejercicios;
- series objetivo;
- repeticiones;
- pesos;
- descanso;
- notas;
- planificación nutricional;
- calorías;
- macros;
- fibra;
- comidas planificadas;
- recetas asignadas;
- contenido de coaching.

### NO puede:

- modificar el email/Auth;
- cambiar credenciales;
- hacerse propietario de la cuenta;
- leer datos expresamente privados;
- modificar preferencias personales sin autorización;
- alterar relaciones de otros coaches;
- acceder a atletas fuera de su espacio.

---

# 11. OWNERSHIP DEL DATO

Esta parte es crítica.

El coach NO debe convertirse en owner de:

```text
profiles
workout_sessions
exercise_sets
daily_metrics
food_logs
```

Estos siguen perteneciendo al usuario.

El coach obtiene:

```text
authorized read access
authorized write access
```

mediante la relación Coach → Athlete.

Conceptualmente:

```text
Athlete owns the data
        │
        ├── self access
        │
        └── authorized coach access
```

Esto permitirá que cuando el atleta cambie de entrenador su información personal continúe existiendo.

---

# 12. VERSIONADO DE PLANES

Esta funcionalidad se vuelve mucho más importante para Coaches.

Actualmente existe `strategy_versions`, pero la documentación indica que todavía no está conectada al frontend.

Aprovechar la evolución para convertirla en foundation real.

Un coach debe poder:

```text
Plan v1
Plan v2
Plan v3
```

Ejemplo:

```text
01/09 — Week 1
08/09 — Week 2
15/09 — Deload
```

Debe quedar registrado:

```text
created_by
created_at
effective_from
effective_until
version
change_reason
snapshot
```

Esto permite:

- histórico;
- auditoría;
- comparar planes;
- revertir;
- ver qué cambió;
- saber quién hizo el cambio.

---

# 13. AUDIT LOG

Implementar un audit trail para acciones sensibles.

Ejemplos:

```text
coach changed workout
coach changed nutrition plan
coach changed calorie goal
coach changed exercise
coach added athlete
coach removed athlete
athlete revoked coach access
```

Entidad conceptual:

```text
audit_logs
------------------------------------------------
id
actor_user_id
space_id
target_user_id
action
entity_type
entity_id
metadata
created_at
```

No almacenar secretos.

---

# 14. CREACIÓN DE UN COACHING SPACE

El flujo de creación debe cambiar según el tipo de espacio.

## Paso 1 — Crear espacio

El usuario selecciona:

```text
What do you want to create?

○ Duo
○ Household
○ Coaching
```

Para Coaching:

```text
Create your coaching space
--------------------------

Space name
Coach display name
Optional branding
Optional description

How many athletes do you want?
○ 5
○ 10
○ 25
○ 50
○ Custom
```

El sistema debe mostrar inmediatamente:

```text
5 athlete seats
4/5 available
```

---

# 15. FLOW DEL COACH

Después de crear el Coaching Space:

```text
Coach Dashboard
```

debe ser completamente diferente al dashboard de atleta.

Debe existir una vista de:

```text
Overview
Athletes
Programs
Nutrition
Analytics
Exercises
Content
Billing
Settings
```

---

# 16. COACH DASHBOARD

Debe poder ver rápidamente:

```text
Total athletes
Active athletes
Athletes at risk
Workout adherence
Nutrition adherence
Recent activity
PRs
Missed workouts
Upcoming workouts
```

Ejemplo:

```text
12 Athletes

8 training today
10 completed yesterday
2 missed sessions
7 nutrition plans on target
3 require attention
```

No implementar métricas ficticias.

Todos los datos deben derivarse de la base real.

---

# 17. ATHLETE MANAGEMENT

Página:

```text
/app/coach/athletes
```

o equivalente según routing final.

Cada atleta debe aparecer como:

```text
Avatar
Name
Status
Current program
Last workout
Workout adherence
Nutrition adherence
Weight trend
Coach notes
```

Acciones:

```text
View
Edit plan
Nutrition
Progress
Notes
Remove
```

---

# 18. PERFIL DEL ATLETA PARA EL COACH

Crear una vista especializada.

Ejemplo:

```text
Athlete Profile

Overview
----------------
Current weight
Weight trend
Workout adherence
Nutrition adherence
Streak
Volume
PRs

Training
----------------
Current program
Upcoming sessions
Recent sessions

Nutrition
----------------
Calories
Protein
Carbs
Fat
Meal plan
Food log

Analytics
----------------
Volume
RPE
Weight
Steps
Training frequency

Notes
----------------
Coach notes
```

No copiar simplemente `PublicProfilePage`.

Crear una vista privada y autorizada.

---

# 19. PLANIFICACIÓN DE ENTRENAMIENTO DESDE COACH

El coach debe poder seleccionar un atleta y entrar a:

```text
Training Plan
```

Debe poder:

- crear día;
- editar día;
- reordenar días;
- agregar ejercicios;
- modificar series;
- modificar repeticiones;
- modificar peso;
- modificar descanso;
- modificar targetSeconds;
- agregar notas;
- copiar ejercicios;
- copiar días;
- duplicar semanas;
- reemplazar ejercicios;
- guardar cambios;
- publicar cambios.

---

# 20. IMPORTANTÍSIMO: DRAFT VS PUBLISHED

Para coaching profesional, evitar modificar directamente el plan activo sin control.

Modelo recomendado:

```text
Draft
  ↓
Review
  ↓
Publish
  ↓
Active plan
```

Mientras el coach edita:

```text
athlete continues using current published plan
```

Al publicar:

```text
new plan becomes active
```

Registrar:

```text
published_by
published_at
version
```

---

# 21. NUTRICIÓN PARA COACHES

El mismo principio debe aplicarse a Nutrition.

Actualmente `nutrition_plans` pertenece a un usuario y contiene:

- calories;
- protein;
- carbs;
- fats;
- fiber;
- notes.

Mantener ownership del atleta.

Permitir al coach:

```text
view
edit
draft
publish
version
```

Ejemplo:

```text
Nutrition Plan

Calories: 2,250
Protein: 180g
Carbs: 220g
Fat: 70g
Fiber: 30g

Notes:
...
```

---

# 22. MEAL PLANNER

El coach debe poder crear:

```text
weekly meal plan
```

para el atleta.

Debe existir separación:

```text
Coach-created plan
Athlete consumption
```

Nunca sobrescribir silenciosamente el Food Log real.

Esto respeta la arquitectura existente donde Meal Planner y Food Log representan cosas distintas.

---

# 23. FOOD LOG

El atleta sigue siendo quien registra consumo.

El coach puede verlo solamente si tiene permiso.

Distinción:

```text
planned
vs
consumed
```

Debe permanecer.

---

# 24. GROCERY LIST

La lista de compras continúa siendo útil especialmente para Household.

Pero debe definirse cómo funciona dentro de Coaching:

### NO asumir automáticamente que el coach administra la Grocery List del atleta.

Por defecto:

```text
athlete owns grocery list
```

Coach puede:

```text
view
```

o:

```text
manage
```

si el modelo lo permite y el atleta concede el permiso.

Esto debe quedar configurable.

---

# 25. INVITACIONES A ATLETAS

Reutilizar el sistema existente de discovery:

```text
public_handle
public_code
```

La documentación ya define ambos mecanismos.

El coach debe poder:

```text
Add athlete
```

y elegir:

```text
Search by:
@handle
TT-XXXXXX
name
```

También soportar:

```text
Invite by link
Invite by email
```

sin crear una segunda identidad de usuario.

---

# 26. INVITACIÓN

Estados:

```text
pending
accepted
declined
expired
cancelled
```

Información:

```text
invited_by
invited_user
space
relationship_type
created_at
expires_at
```

Una invitación a Coaching debe producir:

```text
space membership
+
coach_athlete relationship
```

pero solamente después de aceptación.

---

# 27. ¿QUÉ PASA SI EL ATLETA YA USA LA APP?

Debe poder conectar su cuenta existente.

Ejemplo:

```text
Athlete existing account
        ↓
Accept coach invitation
        ↓
Coach gains authorized access
```

No crear una cuenta duplicada.

---

# 28. ¿QUÉ PASA SI EL ATLETA NO TIENE CUENTA?

Crear onboarding:

```text
Invite
 ↓
Create account
 ↓
Accept coaching relationship
 ↓
Complete onboarding
 ↓
First assigned plan
```

---

# 29. BILLING / LICENCIAS

Esta evolución debe utilizar la foundation comercial que actualmente todavía no existe.

La documentación confirma que todavía faltan:

```text
subscriptions
entitlements
billing_customers
subscription_events
checkout
webhooks
portal
server-side gates
```



Por ello, no implementar billing únicamente como UI.

Debe existir una fuente de verdad server-side.

---

# 30. MODELO COMERCIAL RECOMENDADO PARA COACHES

El coach es el customer del producto.

Conceptualmente:

```text
Coach
   ↓
Subscription
   ↓
Coaching Space
   ↓
Athlete Seats
```

Ejemplo:

```text
Coach Pro
10 Athlete Seats
```

El entrenador paga la plataforma.

Los atletas utilizan esos seats.

La plataforma NO necesita obligatoriamente cobrar individualmente al atleta.

El entrenador puede decidir:

```text
"incluirlo en el precio"
```

o:

```text
"cobrarlo como extra a mi alumno"
```

Ese cobro al atleta puede ocurrir fuera de la plataforma inicialmente.

No construir un marketplace de pagos entre coach y athlete ahora salvo que se requiera posteriormente.

---

# 31. SEAT-BASED BILLING

No usar:

```text
1 subscription = 1 user
```

Para coaching usar:

```text
1 subscription = 1 coaching space + N seats
```

Ejemplo:

```text
Coach plan
---------
Included coach: 1
Athlete seats: 10

Used: 8/10
Available: 2
```

---

# 32. ENTITLEMENTS

Introducir un sistema:

```text
entitlements
```

Ejemplos:

```text
max_athletes
coach_dashboard
athlete_management
advanced_analytics
custom_exercises
user_media_upload
public_exercise_media
nutrition_management
```

Nunca hacer:

```ts
if (subscription === "pro")
```

directamente dentro de componentes.

Usar:

```ts
can("manage_athletes")
can("create_custom_exercise")
can("publish_exercise")
```

---

# 33. BILLING TABLES

Diseñar, como mínimo, conceptualmente:

```text
billing_customers
subscriptions
subscription_items
subscription_events
entitlements
plans
```

y la relación:

```text
subscription
    ↓
space
    ↓
members/seats
```

Implementar idempotencia en webhooks.

Los eventos Stripe/webhook/etc. deben poder procesarse más de una vez sin duplicar entitlements.

---

# 34. REGLA DE CAPACIDAD

`max_members` ya existe conceptualmente en el modelo actual.

Para Coaching:

```text
max_athletes
```

debe controlarse en server-side.

Nunca confiar únicamente en:

```ts
availableSeats > 0
```

en frontend.

El backend debe rechazar la incorporación cuando el entitlement haya sido superado.

---

# 35. EJEMPLO DE FLUJO COMERCIAL

```text
Coach
 ↓
Create Coaching Space
 ↓
Select 10 athlete seats
 ↓
Checkout
 ↓
Subscription active
 ↓
Create space
 ↓
Invite athletes
 ↓
Athletes accept
 ↓
Seat consumed
```

Cuando:

```text
10/10
```

el sistema debe:

```text
block new athlete
```

y mostrar:

```text
No athlete seats available.

Upgrade your plan or purchase another seat.
```

---

# 36. REMOVING ATHLETE

Cuando un atleta abandona:

```text
membership.status = inactive
relationship.status = ended
```

El seat vuelve a estar disponible según la política comercial.

Pero:

```text
athlete data != deleted
```

La información pertenece al atleta.

---

# 37. CAMBIO DE COACH

Debe ser posible:

```text
End relationship with Coach A
Connect with Coach B
```

El atleta conserva:

- profile;
- workout history;
- PRs;
- body metrics;
- Food Log;
- historical plans;
- sessions.

El nuevo coach solamente obtiene acceso autorizado a partir de la relación nueva.

---

# 38. SHARING / PRIVACY

Extender el modelo actual.

Actualmente ya existen:

```text
profile_visibility
progress_visibility
```

y se distingue entre datos propios, household y followers.

No reutilizar esas propiedades de forma incorrecta para Coaching.

Agregar niveles explícitos.

Ejemplo:

```text
PRIVATE
HOUSEHOLD
COACH
FOLLOWERS
PUBLIC
```

Ejemplo:

```text
Weight
☑ Self
☑ Coach
☐ Followers
☐ Public
```

No necesariamente implementar toda esta granularidad en la primera iteración, pero diseñar el modelo para soportarla.

---

# 39. CUSTOM EXERCISES

Actualmente `exercises` funciona como catálogo compartido esencialmente read-only.

Esto debe evolucionar.

Diferenciar:

```text
system exercise
custom exercise
```

y ownership:

```text
system
user
space
```

---

# 40. MODELO DE CUSTOM EXERCISE

Conceptualmente:

```text
exercises
------------------------------------------------
id
external_id
owner_user_id
owner_space_id
visibility
status
name
name_es
description
instructions
muscle_group
target
category
equipment
video_url
gif_url
thumbnail_url
source
source_url
metadata
created_at
updated_at
```

No necesariamente agregar todos los campos directamente si una arquitectura separada es mejor.

---

# 41. VISIBILIDAD DE EJERCICIOS

Estados:

```text
private
space
public
system
```

### PRIVATE

Solo creador.

### SPACE

Solo miembros del Coaching Space correspondiente.

### PUBLIC

Disponible para todos los usuarios, después de pasar moderación y validación.

### SYSTEM

Contenido oficial de la plataforma.

---

# 42. CUSTOM EXERCISE PERMISSIONS

### Athlete

Puede:

```text
create private exercise
```

y potencialmente:

```text
create exercise for own coaching space
```

según permisos.

### Coach

Puede:

```text
create exercise
edit own exercise
publish exercise to space
```

y solicitar:

```text
public publication
```

---

# 43. PUBLIC CONTENT NO SE PUBLICA INMEDIATAMENTE

Para evitar abuso:

```text
draft
 ↓
uploaded
 ↓
processing
 ↓
moderation
 ↓
approved / rejected / review
 ↓
published
```

Estados:

```text
draft
pending_moderation
approved
rejected
flagged
disabled
```

---

# 44. GIFS / VIDEO USER-GENERATED CONTENT

Permitir que entrenadores y usuarios suban:

```text
GIF
MP4
WEBM
```

si la plataforma y clientes lo soportan.

Pero internamente tratarlo como:

```text
media asset
```

no como simple URL.

Crear una entidad:

```text
media_assets
```

o equivalente:

```text
id
owner_user_id
space_id
entity_type
entity_id
type
storage_path
mime_type
size_bytes
duration_ms
width
height
thumbnail_path
processing_status
moderation_status
moderation_score
visibility
created_at
```

---

# 45. STORAGE

No guardar media arbitrariamente en la base de datos.

Usar storage.

Idealmente:

```text
Supabase Storage
```

con paths estructurados:

```text
users/{userId}/exercises/{exerciseId}/...
spaces/{spaceId}/...
```

Aplicar signed URLs cuando corresponda.

No utilizar URLs públicas para contenido privado.

---

# 46. PUBLIC VS PRIVATE MEDIA

### Private

Solo owner.

### Space

Solo miembros autorizados del Space.

### Public

Disponible para catálogo global.

### Moderation

Contenido público requiere moderación obligatoria.

---

# 47. NSFW MODERATION

Implementar defensa en profundidad.

## Primera capa: client-side

Evaluar utilizar:

```text
NSFWJS
```

como pre-check.

NSFWJS funciona en JavaScript/TensorFlow.js y puede clasificar imágenes utilizando categorías de contenido sensible. También documenta uso en Node.js y React Native.

No tratar este resultado como autoridad final.

Objetivo:

```text
user selects file
 ↓
client checks
 ↓
obvious NSFW?
 ↓
block early
```

Esto mejora UX y reduce uploads innecesarios.

---

# 48. SERVER-SIDE MODERATION

El servidor debe ser la autoridad.

Pipeline recomendado:

```text
Upload
 ↓
Storage quarantine
 ↓
Moderation worker/function
 ↓
NSFW classification
 ↓
Store scores
 ↓
Decision
 ↓
Approved / Rejected / Review
 ↓
Publish
```

Para imágenes puede utilizarse AWS Rekognition, que dispone de detección de contenido inapropiado mediante `DetectModerationLabels`.

Para GIF/video, evaluar un servicio que permita analizar múltiples frames o segmentos. AWS Rekognition Video proporciona detección de moderación sobre contenido de vídeo con timestamps y segmentos.

Hive es otra alternativa válida porque soporta JPG, PNG, GIF, MP4 y WEBM y devuelve scores de sensibilidad; la decisión final queda en la aplicación.

Los agentes deben comparar coste, soporte, latencia, privacidad, SDKs y compatibilidad con Supabase antes de cerrar proveedor.

---

# 49. NO BLOQUEAR SOLAMENTE POR UNA PREDICCIÓN BINARIA

No implementar:

```text
nsfw === true
```

Usar:

```text
confidence
category
policy threshold
```

Ejemplo conceptual:

```text
< 0.50
    approved

0.50 - 0.85
    manual review

> 0.85
    rejected
```

Los thresholds deben ser configurables.

No hardcodear valores sin justificar.

---

# 50. MODERATION QUEUE

Crear una estructura preparada para:

```text
moderation_queue
```

con:

```text
asset_id
provider
model_version
category
confidence
status
reviewed_by
reviewed_at
decision
reason
```

Esto será útil si en el futuro existe un panel administrativo.

---

# 51. COPYRIGHT / OWNERSHIP DEL CONTENIDO

Cada ejercicio creado por un usuario debe tener:

```text
created_by
owner_user_id
```

No asumir que la plataforma adquiere automáticamente ownership del contenido.

Para contenido público, guardar metadata:

```text
creator
published_at
source
license
attribution
```

cuando corresponda.

---

# 52. EJERCICIOS DEL COACH

Un coach debería poder marcar:

```text
My exercises
```

y:

```text
Public library
```

Ejemplo:

```text
My Exercises
-----------------
Bulgarian Split Squat — Custom
Cable Chest Press — Custom
Band Shoulder Rotation — Custom

Platform Exercises
-----------------
Bench Press
Squat
Deadlift
...
```

---

# 53. COPIADO DE EJERCICIOS

Un coach puede utilizar un ejercicio público dentro de su plan sin modificar el original.

Esto requiere separar:

```text
exercise definition
```

de:

```text
workout exercise configuration
```

La tabla existente `workout_exercises` ya representa precisamente la configuración de un ejercicio dentro de un día.

Mantener esa separación.

---

# 54. EXERCISE MEDIA

Un ejercicio puede tener:

```text
primary_media
secondary_media
thumbnail
instructions
```

No depender exclusivamente de una única `gif_url`.

Esto permitirá:

```text
exercise
 ├── image
 ├── gif
 ├── video
 └── instructions
```

---

# 55. COACH CONTENT LIBRARY

Agregar una sección:

```text
Content
```

donde el coach pueda administrar:

```text
Exercises
Media
Templates
Programs
```

Inicialmente implementar:

```text
Exercises
Media
```

dejando templates/programs preparados arquitectónicamente.

---

# 56. PROGRAM TEMPLATES

Preparar conceptualmente:

```text
Program Template
```

que pueda luego asignarse a:

```text
one athlete
many athletes
```

Ejemplo:

```text
Hypertrophy 4 Days
 ↓
Assign to
 ↓
Athlete A
Athlete B
Athlete C
```

Pero el programa asignado debe convertirse en una instancia independiente por atleta.

No compartir la misma fila mutable entre todos.

---

# 57. CLONING DE PLANES

Un coach debe poder:

```text
Duplicate plan
Copy week
Copy day
Copy program
Assign template
```

Ejemplo:

```text
Template
  ↓
Athlete A plan
Athlete B plan
Athlete C plan
```

Posteriormente cada uno puede evolucionar independientemente.

---

# 58. REALTIME

La aplicación ya utiliza Supabase Realtime para:

- fitness;
- nutrition;
- social;
- household.

Extender este modelo al coaching.

Ejemplos:

```text
coach changes workout
        ↓
athlete sees update

athlete completes workout
        ↓
coach dashboard updates
```

Pero no volver a hacer refresh completo de todo el estado si puede evitarse.

La documentación identifica que actualmente un evento puede causar refresh completo y que esto puede ser costoso a escala.

Diseñar listeners selectivos por dominio.

---

# 59. RLS

Esta es una de las partes más importantes de la implementación.

Nunca permitir:

```sql
coach_id = auth.uid()
```

sin validar:

```text
coach-athlete relationship
AND
space membership
AND
permission
AND
subscription entitlement
```

Cada policy sensible debe validar:

```text
user owns data
OR
authorized relationship exists
```

Ejemplo conceptual:

```text
Can coach X edit athlete Y's workout?

1. X authenticated
2. X belongs to coaching space
3. Y belongs to same coaching space
4. X is coach
5. coach-athlete relationship active
6. permission edit_workouts granted
7. space subscription allows feature
→ ALLOW
```

Cualquier condición falla:

```text
DENY
```

---

# 60. NO HACER AUTORIZACIÓN SOLO EN REACT

No confiar en:

```tsx
if (isCoach) {
  showEditButton()
}
```

El frontend puede ocultar UI.

Pero la protección real debe estar en:

```text
Supabase RLS
RPC
server-side functions
entitlements
```

El botón no es una medida de seguridad.

---

# 61. RPCs SEGURAS

Para operaciones sensibles crear RPCs transaccionales.

Ejemplos:

```text
create_coaching_space
invite_athlete
accept_coaching_invitation
remove_athlete
publish_workout_plan
publish_nutrition_plan
assign_program
revoke_coach_access
consume_athlete_seat
```

No realizar operaciones críticas mediante una secuencia de múltiples queries desde cliente cuando puedan dejar estados intermedios.

---

# 62. CREACIÓN DE GRUPO — TRANSACCIÓN

Crear:

```text
space
membership owner
billing relationship
entitlement
```

de forma consistente.

No permitir:

```text
space created
but owner missing
```

o:

```text
seat consumed
but athlete membership failed
```

---

# 63. ESTADO DE ATHLETE

Introducir estado útil para coaching:

```text
active
invited
inactive
paused
archived
```

No eliminar atletas físicamente desde la vista del coach.

---

# 64. ARCHIVING

Cuando termina una relación:

```text
archive athlete
```

Mantener:

- histórico;
- sesiones;
- métricas;
- planes históricos;
- notas;
- audit logs.

No destruir la información.

---

# 65. COACH NOTES

Agregar notas privadas del coach.

Importante:

```text
coach notes
```

NO deben ser visibles automáticamente para el atleta.

Debe existir:

```text
private coach note
athlete-visible note
```

o al menos:

```text
visibility = private | shared
```

---

# 66. DASHBOARD DEL ATLETA

No destruir la experiencia actual.

Cuando un usuario es athlete:

```text
App
 ├── My Training
 ├── My Nutrition
 ├── My Progress
 ├── My Coach
```

Agregar un área:

```text
My Coach
```

con:

```text
Coach name
Current program
Latest updates
Coach notes shared with me
```

---

# 67. MODO MULTI-CONTEXTO

Si un usuario pertenece a:

```text
Household
+
Coaching Space
```

el UI debe permitir cambiar de contexto.

Ejemplo:

```text
Workspace switcher

My Personal
Family
Juan Fitness
```

Esto será extremadamente importante cuando los usuarios pertenezcan a múltiples espacios.

---

# 68. PERSONAL VS WORKSPACE DATA

Separar claramente:

```text
PERSONAL
```

de:

```text
WORKSPACE
```

Ejemplo:

```text
Personal Profile
Personal History
Personal Preferences
```

vs:

```text
Coaching Program
Coach Relationship
Coach Notes
Group Membership
```

---

# 69. ROUTING

No hardcodear una aplicación diferente.

Agregar rutas según capacidad/rol.

Ejemplo:

```text
/app
/app/training
/app/nutrition
/app/progress

/app/coaching
/app/coaching/athletes
/app/coaching/athletes/:id
/app/coaching/programs
/app/coaching/content
/app/coaching/billing
```

Las rutas deben tener guards de autorización.

---

# 70. NAVEGACIÓN

Para atleta:

```text
Dashboard
Training
Nutrition
Progress
History
Coach
Profile
```

Para coach:

```text
Dashboard
Athletes
Programs
Nutrition
Analytics
Content
Billing
Settings
```

No mostrar navegación que el usuario no pueda usar.

---

# 71. RESPONSIVE / MOBILE

Toda la funcionalidad debe funcionar en:

```text
desktop
tablet
mobile
```

El coach probablemente utilizará más desktop, pero el atleta puede utilizar principalmente mobile.

No construir lógica dependiente de desktop.

---

# 72. COMPONENTIZACIÓN

Evitar duplicar:

```text
WorkoutBuilder
NutritionPlanEditor
ExercisePicker
ProgressCharts
```

Crear componentes reutilizables con un contexto de autorización.

Ejemplo:

```text
WorkoutBuilder
    ↓
subjectUserId
    ↓
permissions
```

Esto permitirá:

```text
athlete edits own workout
coach edits athlete workout
```

utilizando la misma lógica de negocio.

---

# 73. CAMBIO CRÍTICO EN `FitnessContext`

Actualmente `FitnessContext` centraliza las entidades y acciones del dominio.

No permitir que continúe suponiendo:

```text
currentUser = only writable owner
```

Evolucionar hacia operaciones con explícita identificación del sujeto:

```ts
updateWorkoutPlan({
  userId,
  ...
})
```

pero siempre pasando previamente por:

```ts
authorization service
```

y dejando la seguridad real en backend/RLS.

---

# 74. AUTHORIZATION SERVICE

Crear una capa como:

```text
lib/authorization.ts
```

o equivalente.

Ejemplos:

```ts
canViewAthlete(userId, athleteId)
canEditWorkout(userId, athleteId)
canEditNutrition(userId, athleteId)
canManageAthlete(userId, athleteId)
canCreateExercise(userId, spaceId)
canPublishExercise(userId, exerciseId)
```

No repetir lógica de autorización en 20 componentes.

---

# 75. DATA ACCESS

Evolucionar `repository.ts` para admitir:

```text
scope/context
subject user
workspace
relationship
```

Pero no convertirlo en un archivo gigante.

Separar dominios:

```text
coach.ts
spaces.ts
billing.ts
permissions.ts
media.ts
moderation.ts
```

---

# 76. ESTADO FRONTEND

No depender de cargar todos los atletas y todos sus datos de una vez.

Actualmente `loadRemoteState()` consulta globalmente entidades fitness del usuario autenticado.

Eso no escala para un coach con:

```text
50 athletes
100 athletes
500 athletes
```

Diseñar queries scoped:

```text
getAthletes(spaceId)
getAthleteOverview(athleteId)
getAthleteWorkoutPlan(athleteId)
getAthleteProgress(athleteId)
getAthleteNutrition(athleteId)
```

No cargar todo el universo del coach.

---

# 77. PAGINACIÓN

Las vistas de coach deben paginar:

```text
athletes
sessions
activity
food logs
history
```

Nunca asumir que:

```text
10 users
```

será el límite.

---

# 78. SEARCH

Implementar búsqueda:

```text
athlete name
handle
public code
status
program
```

con filtros.

---

# 79. ANALYTICS DEL COACH

Agregar métricas:

```text
workout adherence
nutrition adherence
weekly volume
missed sessions
average RPE
weight trend
body measurements
step adherence
```

No inventar nuevos cálculos si las funciones existentes pueden reutilizarse.

La aplicación ya tiene funciones de:

```text
calculateVolume
calculateAdherence
calculatePersonalRecords
buildProgressData
buildNutritionComparison
calculateNutritionAdherence
```



Reutilizar y generalizar estas funciones.

---

# 80. ATHLETE COMPARISON

Un coach puede visualizar múltiples atletas, pero no debe existir un modelo que exponga datos involuntariamente.

Comparaciones deben existir únicamente dentro del Coaching Space.

Ejemplo:

```text
Average adherence
Highest volume
Most consistent
```

Evitar mostrar información sensible si no es necesaria.

---

# 81. SOCIAL VS COACHING

Mantener separadas:

```text
Follow
Household
Coaching Relationship
Public Profile
```

No reutilizar:

```text
profile_follows
```

como relación coach-athlete.

La propia documentación ya señala que Follow, sharing y pertenencia a household son permisos distintos.

---

# 82. INVITATION UX

Cuando alguien recibe:

```text
Juan wants you to join his coaching program.
```

mostrar:

```text
Coach
Space
What permissions will be available
Privacy
Accept
Decline
```

Especialmente importante:

```text
What can this coach see?
What can this coach edit?
```

---

# 83. ATHLETE PERMISSION CENTER

El atleta debe poder administrar el acceso del coach.

Pantalla:

```text
My Coach
----------------
Juan Fitness

Access:
✓ Workouts
✓ Progress
✓ Nutrition
✓ Food Log

Permissions:
[ Manage access ]
[ Revoke access ]
```

Esto genera confianza.

---

# 84. PERMISSION CHANGE

Cuando el atleta revoca:

```text
coach_athlete_relationship.status = revoked
```

y todas las RLS deben dejar de permitir acceso inmediatamente.

No depender de logout o cache frontend.

---

# 85. CACHE / REALTIME / SECURITY

Evitar que datos de un atleta queden visibles después de:

```text
relationship revoked
space changed
permission removed
subscription expired
```

Invalidar queries y estado local inmediatamente.

---

# 86. BILLING EXPIRATION

Cuando una suscripción de Coach expira:

```text
subscription = past_due / canceled / expired
```

definir claramente:

### Coach

Puede:

```text
see billing
restore
upgrade
```

### Athlete

Debe poder:

```text
seguir accediendo a su información personal
```

La expiración comercial NO debe destruir el histórico.

Definir también si el atleta puede:

```text
seguir ejecutando su plan existente
```

o si ciertas funciones premium quedan bloqueadas.

---

# 87. GRACE PERIOD

Preparar soporte para:

```text
active
trialing
past_due
grace_period
canceled
expired
```

No asumir únicamente:

```text
active / inactive
```

---

# 88. FEATURE GATING

Crear:

```text
useEntitlement()
```

o equivalente.

Ejemplo:

```ts
canCreateAthlete
canViewAdvancedAnalytics
canUploadMedia
canPublishExercise
canManageNutrition
```

Frontend solamente refleja la decisión.

Backend vuelve a validar.

---

# 89. ADMIN / PLATFORM FUTURE

No es necesario implementar un panel administrativo completo ahora.

Pero diseñar pensando que eventualmente existirán:

```text
Platform Admin
Moderator
Support
Billing Admin
```

No reutilizar:

```text
coach
```

para funciones administrativas globales.

---

# 90. CONTENT MODERATION UX

Cuando un coach suba un GIF:

```text
Uploading...
Processing...
Checking content...
```

Si falla:

```text
This media could not be published because it does not comply with community guidelines.
```

No mostrar la razón técnica completa.

---

# 91. MODERATION FALLBACK

Si el proveedor de moderación está caído:

```text
DO NOT auto-publish public media
```

Mover a:

```text
pending_moderation
```

El contenido privado puede seguir una política diferente.

---

# 92. PUBLIC CONTENT

Un contenido público debe cumplir:

```text
valid media
valid metadata
moderation approved
creator authorized
not deleted
not revoked
```

Solo después:

```text
public catalog
```

---

# 93. REPORTING

Preparar:

```text
content_reports
```

con:

```text
reporter
content
reason
status
created_at
reviewed_at
```

No necesariamente implementar toda la UI inicialmente.

---

# 94. DELETE CONTENT

Cuando el creador elimina un ejercicio público:

No eliminar inmediatamente cualquier referencia histórica.

Los workouts históricos deben seguir pudiendo mostrar:

```text
Exercise name
```

aunque el contenido multimedia desaparezca.

Esto es crítico para integridad histórica.

---

# 95. SOFT DELETE

Para contenido y entidades sensibles usar:

```text
deleted_at
```

cuando corresponda.

No eliminar datos históricos por defecto.

---

# 96. EXERCISE REFERENCES

Los `workout_exercises` y `exercise_sets` deben seguir funcionando aunque:

```text
exercise visibility changes
exercise is unpublished
exercise creator deletes media
```

Nunca romper sesiones históricas.

---

# 97. MIGRATION SAFETY

Antes de escribir migraciones:

1. inspeccionar schema real;
2. revisar todas las foreign keys;
3. revisar policies;
4. revisar RPCs;
5. revisar índices;
6. revisar realtime publication;
7. revisar seeds;
8. revisar tipos frontend.

Crear migraciones incrementales.

No hacer un "big bang migration".

---

# 98. RLS TESTS OBLIGATORIOS

Actualmente existen tests unitarios, pero la documentación señala que faltan tests completos de RLS, E2E y otros aspectos.

Agregar pruebas para:

### Athlete

- puede leer su información;
- puede modificar su información.

### Coach

- puede leer atleta autorizado;
- puede editar atleta autorizado.

### Coach sin relación

- no puede leer.

### Coach de otro space

- no puede leer.

### Revoked relationship

- no puede leer.

### Deleted membership

- no puede leer.

### Public user

- no puede leer datos privados.

### Billing expired

- las operaciones premium deben bloquearse.

---

# 99. TEST MATRIX

Crear una matriz de:

```text
Actor
Resource
Action
Expected Result
```

Ejemplo:

```text
Coach A
Athlete A
Edit workout
ALLOW

Coach A
Athlete B
Edit workout
DENY

Athlete A
Own workout
Edit
ALLOW

Athlete A
Athlete B
Read workout
DENY

Follower A
Athlete B
Private nutrition
DENY
```

---

# 100. E2E SCENARIOS

Agregar pruebas E2E de:

### Scenario 1

Coach creates coaching space.

### Scenario 2

Coach pays for 5 seats.

### Scenario 3

Coach invites athlete.

### Scenario 4

Athlete accepts.

### Scenario 5

Coach assigns workout.

### Scenario 6

Athlete completes workout.

### Scenario 7

Coach sees result.

### Scenario 8

Coach changes nutrition.

### Scenario 9

Athlete revokes nutrition permission.

### Scenario 10

Coach loses nutrition access.

### Scenario 11

Coach subscription expires.

### Scenario 12

Athlete keeps personal history.

---

# 101. PERFORMANCE

No asumir que:

```text
5 athletes
```

es el límite.

Arquitectura preparada para:

```text
10
25
50
100+
```

No cargar todo el estado de todos los usuarios.

---

# 102. INDEXES

Agregar índices adecuados para:

```text
space_id
user_id
coach_user_id
athlete_user_id
relationship status
membership status
subscription status
created_at
exercise owner
exercise visibility
media moderation status
```

Analizar queries reales antes de crear índices redundantes.

---

# 103. TYPES

Generar tipos oficiales Supabase cuando sea posible.

La documentación actual reconoce que `database.ts` es todavía manual.

Esta evolución es una buena oportunidad para:

```text
SupabaseClient<Database>
```

y evitar strings/tipos inconsistentes.

---

# 104. REPOSITORY LAYERS

Proponer:

```text
repository/
 ├── users.ts
 ├── spaces.ts
 ├── memberships.ts
 ├── coaching.ts
 ├── workouts.ts
 ├── nutrition.ts
 ├── billing.ts
 ├── exercises.ts
 ├── media.ts
 ├── moderation.ts
 └── analytics.ts
```

No es obligatorio exactamente este árbol, pero evitar un `repository.ts` monolítico.

---

# 105. DOMAIN MODEL

El modelo final debe poder representar:

```text
USER
 │
 ├── PERSONAL DATA
 │
 ├── FOLLOW RELATIONSHIPS
 │
 └── SPACE MEMBERSHIPS
        │
        ├── DUO
        ├── HOUSEHOLD
        └── COACHING
               │
               ├── COACH
               └── ATHLETES
```

y:

```text
COACH
 │
 └── COACH_ATHLETE_RELATIONSHIP
           │
           ├── permissions
           ├── access
           └── audit
```

---

# 106. DOCUMENTATION

Actualizar `DOCUMENTACION_TECNICA.md` después de implementar.

Agregar:

```text
New domain model
Spaces
Memberships
Coach/Athlete relationships
Permissions
Billing
Entitlements
Custom exercises
Media
Moderation
RLS
Realtime
Tests
```

No dejar la documentación desactualizada.

---

# 107. SEEDS

Extender los seeds actuales.

Agregar:

```text
coach_demo
athlete_demo_1
athlete_demo_2
...
```

Crear:

```text
one coaching space
several athletes
relationships
sample programs
sample nutrition
sample activity
```

Esto permitirá validar el dashboard del coach.

---

# 108. DEMO MODE

Actualmente existe fallback local/demo mediante `localStorage`. La documentación deja claro que eso no debe considerarse almacenamiento seguro de producción.

En demo mode:

```text
Coach
Athletes
Spaces
Relationships
```

deben existir únicamente como mock/demo data.

No intentar replicar seguridad de producción usando `localStorage`.

---

# 109. INTERNATIONALIZATION

Toda la funcionalidad nueva debe soportar:

```text
ES
EN
```

No hardcodear textos.

Ejemplos:

```text
Coach
Athlete
Coaching Space
Invite athlete
Assign program
Nutrition plan
Permissions
Billing
Seats
Moderation
```

---

# 110. UI / UX PRINCIPLES

El coach debe sentir que está usando:

```text
professional management platform
```

y el atleta:

```text
personal fitness app
```

No convertir toda la aplicación en un dashboard administrativo.

---

# 111. ONBOARDING DIFERENCIADO

Después de crear una cuenta:

```text
How are you using Train Together?

○ I'm training for myself
○ I'm training with a partner/family
○ I'm a personal trainer/coach
```

Esto no debe fijar permanentemente el usuario.

Un usuario podría posteriormente crear:

```text
personal space
coaching space
```

---

# 112. COACH PROFILE

Agregar metadata opcional:

```text
is_coach
coach_display_name
bio
specialties
certifications
location
website
social links
```

Pero no convertirlo todavía en marketplace.

---

# 113. FUTURO MARKETPLACE

Diseñar sin implementar:

```text
Public Coach Profile
Reviews
Clients
Booking
Payments
Packages
```

No implementar marketplace en esta fase.

El objetivo actual es:

```text
Coach management
```

no:

```text
Coach discovery marketplace
```

---

# 114. FUTURO MULTI-COACH

No bloquear arquitectónicamente:

```text
Coach A
Coach B
Athlete
```

Ejemplo:

```text
Strength Coach
Nutrition Coach
```

Aunque inicialmente se permita únicamente un coach principal.

---

# 115. FUTURO ASSISTANT COACH

Preparar role:

```text
assistant_coach
```

con permisos limitados.

Ejemplo:

```text
view_workouts
view_progress
view_notes
```

pero sin:

```text
billing
manage_members
delete_space
```

No implementar UI completa si no es necesario ahora.

---

# 116. IMPORTANT: NO HACER ESTO

No:

- duplicar tablas de workouts para coaches;
- duplicar tablas de nutrition;
- crear `coach_workouts`;
- crear `coach_nutrition`;
- usar `coach_id` dentro de todas las tablas existentes;
- convertir al coach en owner del atleta;
- depender únicamente de roles frontend;
- usar Follow como mecanismo de autorización;
- usar `household_members` como único mecanismo de coaching;
- almacenar GIFs públicos sin moderación;
- publicar contenido antes de terminar moderación;
- eliminar datos históricos al finalizar una relación;
- hardcodear límites comerciales;
- implementar billing solo visualmente;
- crear un segundo sistema de autenticación.

---

# 117. REFACTORIZACIÓN NECESARIA

Antes de desarrollar features nuevas, detectar lugares donde el código actual asume:

```text
couple
other member
two users
single household
current user owns all writable data
```

y reemplazarlos por:

```text
space
membership
relationship
permissions
subject user
```

Especial atención a:

```text
getCoupleSummaries()
HouseholdPage
household.ts
people.ts
repository.ts
FitnessContext
RLS helpers
Realtime channels
nutrition access
```

---

# 118. LEGACY COMPATIBILITY

`getCoupleSummaries()` y nomenclatura de "couple" deben migrar progresivamente.

No dejar en el nuevo dominio conceptos como:

```text
coupleMember
```

si ya representan un usuario genérico dentro de un space.

Mantener aliases temporales solamente cuando sean imprescindibles para migración.

---

# 119. NUEVAS FUNCIONES SQL / SECURITY DEFINER

Probablemente serán necesarias funciones como:

```text
is_space_member()
is_space_owner()
is_coach_of()
can_view_athlete()
can_edit_athlete_workout()
can_edit_athlete_nutrition()
has_entitlement()
has_available_athlete_seat()
```

Deben estar diseñadas para evitar la recursión RLS que ya tuvo que corregirse en el modelo actual.

La arquitectura existente utiliza funciones `security definer` precisamente para evitar ese tipo de recursión.

---

# 120. RLS HELPER RULE

Una policy no debe:

```sql
SELECT FROM same_table
```

de forma recursiva.

Utilizar helpers seguros apropiados.

Probar explícitamente:

```text
anonymous
self
same-space
same-coach-space
different-space
revoked
```

---

# 121. REALTIME EVENTS

Agregar eventos específicos:

```text
athlete_added
athlete_removed
workout_plan_updated
nutrition_plan_updated
coach_note_added
coach_permission_changed
coaching_relationship_changed
```

No es obligatorio convertir cada acción en activity feed público.

Diferenciar:

```text
Realtime system event
```

de:

```text
user-facing activity event
```

---

# 122. COACH ACTIVITY FEED

Crear un feed interno:

```text
Recent athlete activity
```

Ejemplo:

```text
Maria completed Lower Body
Pedro hit a new PR
Juan missed today's workout
Sofia logged nutrition
```

Este feed no tiene por qué ser visible públicamente.

---

# 123. NOTIFICATIONS

Preparar arquitectura para:

```text
coach assigned workout
coach changed nutrition
coach added note
new invitation
subscription issue
seat limit reached
```

No obligatoriamente implementar push notifications ahora.

---

# 124. IA FUTURA

La plataforma ya posee un AI Assistant server-side.

No permitir automáticamente que un Coach use AI sobre atletas sin aplicar los mismos permisos.

El contexto del AI debe respetar:

```text
coach relationship
permissions
space
athlete visibility
```

Ejemplo:

```text
Coach asks:
"How is Maria progressing?"
```

Solo incluir datos permitidos para ese coach.

---

# 125. PRIVACY BY DEFAULT

Nuevo contenido:

```text
private by default
```

Especialmente:

- custom exercises;
- media;
- notes;
- Food Logs;
- body metrics.

Publicación debe ser una acción explícita.

---

# 126. CONTENT POLICY

Definir inicialmente que los siguientes contenidos están prohibidos en la biblioteca pública:

- pornográfico;
- nudity sexual;
- sexual acts;
- contenido sexual explícito;
- contenido violento gráfico;
- contenido ilícito según la política de la plataforma.

El catálogo público debe priorizar:

```text
fitness
training
exercise
education
```

---

# 127. MEDIA OPTIMIZATION

No servir GIFs originales pesados indiscriminadamente.

Pipeline futuro:

```text
upload
 ↓
normalize
 ↓
thumbnail
 ↓
optimized preview
 ↓
original/private asset
```

Considerar:

```text
WebP
AVIF
MP4/WebM
```

cuando sea apropiado.

---

# 128. MEDIA LIMITS

Crear límites configurables:

```text
max file size
max duration
max dimensions
allowed mime types
```

Los límites deben depender del entitlement.

Ejemplo:

```text
FREE
no uploads

COACH
100 MB/month

PRO
500 MB/month
```

Los números son placeholders y no deben asumirse como pricing final.

---

# 129. COST CONTROL

La arquitectura debe contemplar:

```text
storage usage
moderation API cost
bandwidth
processing
```

porque user-generated media puede aumentar costos rápidamente.

Registrar usage por:

```text
user
space
subscription
```

---

# 130. ANALYTICS DE USO

Preparar métricas:

```text
active athletes
seats used
media uploads
storage
exercise creations
coach actions
```

No mezclar analytics comerciales con datos fitness sensibles.

---

# 131. MIGRATION ORDER

Orden recomendado:

## Phase 1 — Domain Foundation

- generic spaces;
- memberships;
- multiple memberships per user;
- roles;
- relationships.

## Phase 2 — Authorization

- permissions;
- RLS;
- security helpers;
- tests.

## Phase 3 — Coach UX

- coach onboarding;
- coach dashboard;
- athlete management;
- athlete detail.

## Phase 4 — Managed Programs

- workout editing;
- nutrition editing;
- versioning;
- drafts;
- publish.

## Phase 5 — Billing

- plans;
- subscriptions;
- entitlements;
- seats;
- webhook;
- gates.

## Phase 6 — Custom Exercises

- exercise ownership;
- private/space/public.

## Phase 7 — Media

- storage;
- upload;
- processing;
- thumbnails.

## Phase 8 — Moderation

- NSFWJS pre-check;
- server moderation;
- queue;
- rejection/review.

## Phase 9 — Hardening

- RLS tests;
- E2E;
- performance;
- Realtime;
- documentation.

---

# 132. FIRST TASK FOR THE AGENTS

Antes de programar:

### STEP 1

Inspect:

```text
database schema
migrations
RLS
RPCs
repository
contexts
routing
components
nutrition
exercise system
```

### STEP 2

Crear un documento:

```text
COACHING_ARCHITECTURE_ANALYSIS.md
```

con:

```text
current assumptions
required changes
tables affected
RLS affected
frontend affected
migration strategy
billing dependencies
risks
```

### STEP 3

No modificar código crítico hasta cerrar el modelo.

---

# 133. ACCEPTANCE CRITERIA — DOMAIN

Considerar la foundation correcta cuando:

- un usuario puede pertenecer a múltiples spaces;
- existe `coaching` como tipo de space;
- existe relación coach-athlete;
- el atleta conserva ownership de sus datos;
- el coach puede acceder mediante relación;
- Follow sigue separado;
- Household sigue funcionando;
- Duo sigue funcionando;
- legacy couple sigue migrable.

---

# 134. ACCEPTANCE CRITERIA — COACH

Un coach puede:

- crear Coaching Space;
- administrar atletas;
- invitar atleta;
- aceptar atleta;
- visualizar progreso;
- editar workout;
- editar nutrition;
- publicar cambios;
- consultar historial;
- gestionar permisos;
- quitar atleta.

---

# 135. ACCEPTANCE CRITERIA — ATHLETE

Un atleta puede:

- aceptar coach;
- ver su coach;
- ver planes;
- ejecutar workouts;
- registrar Food Log;
- consultar nutrición;
- consultar progreso;
- controlar permisos;
- revocar coach;
- mantener historial.

---

# 136. ACCEPTANCE CRITERIA — BILLING

El sistema:

- sabe quién es el payer;
- conoce la suscripción;
- conoce los entitlements;
- conoce seats;
- impide superar seats;
- procesa webhooks idempotentemente;
- bloquea funciones premium server-side;
- mantiene datos históricos después de expiración.

---

# 137. ACCEPTANCE CRITERIA — MEDIA

El sistema:

- permite subir custom exercise media;
- guarda media en storage;
- no expone assets privados públicamente;
- analiza contenido;
- bloquea NSFW público;
- conserva moderation score;
- soporta review;
- permite publicar contenido aprobado.

---

# 138. ACCEPTANCE CRITERIA — SECURITY

No debe existir un camino por el cual:

```text
Coach A
```

pueda consultar:

```text
Athlete B
```

sin relación autorizada.

Esto debe validarse directamente mediante RLS tests y queries reales.

---

# 139. ACCEPTANCE CRITERIA — REGRESSION

Después de implementar la evolución:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

deben seguir funcionando.

Además agregar tests específicos de:

```text
coaching
permissions
RLS
billing
media
moderation
```

---

# 140. IMPLEMENTATION PRINCIPLE

No intentar construir todas las features inmediatamente.

La prioridad es:

```text
CORRECT DOMAIN
        ↓
CORRECT AUTHORIZATION
        ↓
CORRECT DATA MODEL
        ↓
COACH UX
        ↓
BILLING
        ↓
MEDIA
        ↓
PUBLIC CONTENT
```

No invertir el orden.

---

# 141. IMPORTANT PRODUCT DECISION

La idea central de esta evolución es:

> Train Together no debe ser solamente una app para que dos personas entrenen juntas. Debe convertirse en una plataforma donde diferentes tipos de relaciones fitness puedan convivir sobre una misma identidad y una misma arquitectura.

Modelo conceptual:

```text
                         TRAIN TOGETHER
                               │
                    ┌──────────┴──────────┐
                    │                     │
                  USERS                 SPACES
                    │                     │
          ┌─────────┼─────────┐    ┌─────┼───────────────┐
          │         │         │    │     │               │
       Personal   Follow   Coaching Duo Household     Future
                              │
                         ┌────┴────┐
                         │         │
                       Coach    Athletes
                                  │
                       ┌──────────┼──────────┐
                       │          │          │
                    Training   Nutrition   Progress
                       │          │          │
                    Sessions   Meal Plans  Analytics
                                  │
                            Grocery / Food Log
```

La plataforma debe preservar la experiencia actual y convertirla gradualmente en una infraestructura de colaboración fitness más general.

---

# 142. DEFINITION OF DONE

La tarea NO está terminada cuando:

```text
el botón de Coach funciona
```

Está terminada cuando:

```text
data model
+
RLS
+
permissions
+
UX
+
billing
+
relationships
+
media
+
moderation
+
tests
+
documentation
```

se comportan de forma consistente.

No aceptar soluciones que funcionen solamente en frontend.

No dejar TODOs de seguridad críticos.

No desactivar RLS para hacer que una feature funcione.

No usar service role desde el navegador.

No exponer secrets.

No duplicar dominios existentes.

No romper `household`, `duo` ni la experiencia individual actual.
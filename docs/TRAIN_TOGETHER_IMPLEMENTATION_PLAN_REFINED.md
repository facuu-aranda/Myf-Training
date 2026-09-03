# Train Together — Refined SaaS + Social/Household Implementation Plan

> **Fecha:** 2026-09-02  
> **Documento:** plan maestro de implementación para agente de coding  
> **Fuentes principales:** `DOCUMENTACION_TECNICA.md` + `TRAIN_TOGETHER_MONETIZATION_FOUNDATION_PROMPT.md`  
> **Objetivo:** evolucionar el repositorio existente a una base SaaS sólida, incorporando descubrimiento de perfiles/cuentas, conexión social, seguimiento de progreso y composición explícita de hogares/DUO, sin romper Training, Nutrition, Realtime ni el modo demo local.

---

## 0. Instrucción ejecutiva para el agente

Trabaja sobre el repositorio existente `MyF-Training`. **No crear un proyecto paralelo, no reescribir desde cero y no sustituir componentes funcionales sin una razón técnica concreta.**

La documentación técnica actual describe una SPA React 19 + Vite 6 + TypeScript + React Router + Supabase Auth/PostgreSQL/RLS/Realtime, con Training, Nutrition, Food Log, Meal Planner, Grocery, Insights, Couple/Household y modo demo local. El modelo actual todavía infiere a la pareja a partir del conjunto de perfiles y no consulta explícitamente `couples` / `couple_members` desde la UI; esa inferencia debe eliminarse. El objetivo comercial propone evolucionar a `households` / `household_members`, con DUO como plan comercial insignia y con autorización basada en entitlements.  

**Nueva capacidad obligatoria de esta revisión:** un usuario debe poder descubrir y localizar visualmente a otras cuentas mediante:

1. nombre visible;
2. `username`/handle;
3. identificador público estable y no sensible;
4. avatar;
5. código/ID compartible mostrado explícitamente en el perfil;

y desde un resultado de búsqueda debe poder:

- abrir el perfil público;
- solicitar seguirlo;
- invitarlo a un household;
- seleccionarlo como segundo miembro para DUO;
- aceptar/rechazar la conexión;
- activar, con consentimiento y reglas de privacidad, la visualización de progreso compartido;
- distinguir claramente entre **seguir a alguien**, **compartir progreso** y **ser miembro del mismo household**.

### Regla de negocio importante

No inventar un plan comercial `HOUSE` como cuarto tier. Los documentos actuales definen `FREE`, `PLUS` y `DUO`; `household` es la unidad de colaboración/propiedad compartida y DUO es el producto comercial insignia. Si el producto realmente necesita un tier comercial `HOUSE`, debe introducirse como extensión explícita de configuración, no como supuesto escondido en el código.

---

# 1. Estado real que el agente debe asumir

## 1.1 Stack actual

Mantener:

- React 19
- Vite 6
- TypeScript 5.7
- React Router 6
- Supabase JS 2
- PostgreSQL 15
- Supabase RLS
- Supabase Realtime
- Tailwind CSS 3
- CSS propio
- Framer Motion
- Recharts
- Lucide React
- i18next/react-i18next
- Yarn 1.x
- Vitest
- ESLint 9
- Supabase CLI

La documentación confirma que el repositorio no utiliza una librería externa de estado; el estado de dominio se centraliza en `FitnessContext`.

## 1.2 Arquitectura existente

```text
UI / Pages
    ↓
Contexts + hooks
    ↓
lib/analytics.ts + lib/live.ts
    ↓
FitnessContext + lib/repository.ts
    ↓
Supabase Auth / PostgreSQL / Realtime
```

No crear Express, REST API ni una capa HTTP propia salvo que una necesidad real de Stripe/webhooks/seguridad server-side lo requiera.

## 1.3 Funcionalidad que NO se debe romper

Conservar y verificar:

- Landing
- Login
- Dashboard
- Strategy
- Live Training
- Manual Training
- Quick Log
- Progress
- History
- Couple
- Exercise Library
- Profile
- Food Library
- Recipes
- Food Log
- Meal Planner
- Grocery
- Nutrition Insights

La documentación actual registra que lint, typecheck, tests y build pasaban en el baseline y que actualmente no existen tests automatizados reales de RLS, Realtime, E2E, accesibilidad ni integración Supabase. Esta nueva fase debe ampliar esa cobertura.

---

# 2. Decisiones de producto que deben quedar implementadas

## 2.1 Tres conceptos distintos

El sistema debe distinguir explícitamente:

### A. Follow / Seguimiento

Relación social.

```text
User A follows User B
```

Puede existir sin household y sin compartir datos privados.

### B. Shared Progress / Seguimiento de progreso

Permiso de visibilidad sobre una selección de indicadores.

Ejemplo:

```text
User A puede ver de User B:
- entrenamientos completados
- racha
- volumen semanal
- metas de pasos
- PRs visibles
```

No significa automáticamente:

```text
peso corporal
notas privadas
Food Log privado
estrategia privada
comentarios privados
```

### C. Household Membership

Relación de colaboración.

```text
User A
   +
User B
   ↓
Household
```

Es la relación que habilita recursos realmente compartidos:

- recetas shared
- shared meals
- grocery
- household activity
- couple/household progress
- coordinated planning

Esta separación evita que "seguir" implique acceso a información privada.

---

# 3. Modelo comercial y de acceso

## 3.1 Planes comerciales

Mantener:

```ts
type PlanCode = "free" | "plus" | "duo";
```

No usar:

```ts
if (plan === "duo")
```

repartido por las páginas.

Usar un servicio central:

```ts
can("couple.sharedProgress")
can("household.sharedMeals")
can("household.grocery")
can("analytics.advanced")
can("profile.discovery")
```

## 3.2 Entidades comerciales

La jerarquía objetivo es:

```text
auth.users
    ↓
profiles
    ↓
households
    ↓
household_members
    ↓
subscriptions
    ↓
entitlements
```

DUO pertenece al household, no al usuario individual.

```text
User A
User B
   ↓
Household
   ↓
Duo subscription
```

Nunca:

```text
User A → Duo
User B → Duo
```

La documentación establece que al activar DUO para un household ambos miembros reciben las entitlements de DUO y el segundo usuario no debe comprar una segunda suscripción.

---

# 4. Nuevo modelo de identidad pública

La tabla `profiles` ya tiene:

```text
id
username
display_name
first_name
avatar_url
active
...
```

pero `id` es el UUID interno de `auth.users` y no debe ser el identificador público que el usuario comparte.

## 4.1 Añadir identidad pública estable

Agregar a `profiles` una identidad pública explícita.

Recomendado:

```sql
public_handle text unique not null
public_code text unique not null
discoverable boolean not null default true
profile_visibility text not null default 'discoverable'
progress_visibility text not null default 'household'
```

### Significado

`public_handle`

- legible;
- amigable;
- puede derivarse inicialmente del username;
- editable con reglas claras;
- unique case-insensitive.

`public_code`

- identificador estable para compartir;
- no revela UUID;
- generado aleatoriamente;
- no debe poder predecirse;
- debe permanecer estable salvo regeneración explícita.

Ejemplo visual:

```text
@facundo
TT-7K4M9P
```

No mostrar:

```text
550e8400-e29b-41d4-a716-446655440000
```

## 4.2 Índices

Crear índices para búsqueda:

```sql
create unique index profiles_public_handle_lower_idx
on profiles (lower(public_handle));

create unique index profiles_public_code_idx
on profiles (public_code);
```

No depender de `ILIKE '%texto%'` sobre toda la tabla sin una estrategia de índice o límite.

Para la primera iteración puede bastar con:

```text
username exact/prefix
public_handle exact/prefix
public_code exact
display_name prefix
```

Si PostgreSQL local/entorno lo permite, evaluar `pg_trgm` para búsqueda parcial sobre handles/nombres. No introducir una extensión si no es necesaria para el primer milestone.

---

# 5. Perfil público vs perfil privado

## 5.1 Perfil público mínimo

Un perfil que aparece en búsqueda puede mostrar:

```text
Avatar
Display name
@handle
TT-code
Seguidores / siguiendo (futuro o básico)
Estado de conexión
Resumen de progreso compartible
```

No mostrar por defecto:

- email
- UUID
- notas
- peso
- Food Log privado
- estrategia privada
- historial privado completo
- datos sensibles no declarados como compartibles.

## 5.2 Visibilidad explícita

No inferir:

```text
"es mi pareja"
```

para decidir acceso.

La visibilidad debe depender de una política explícita.

Propuesta:

```ts
type ProfileVisibility =
  | "private"
  | "discoverable";

type ProgressVisibility =
  | "private"
  | "followers"
  | "household";
```

### Semántica

`private`

- no aparece en búsqueda pública de perfiles;
- solo puede encontrarse mediante invitación/código si se decide habilitarlo en el futuro.

`discoverable`

- aparece en la búsqueda autenticada;
- muestra información pública mínima.

`progressVisibility = private`

- nadie más ve progreso.

`progressVisibility = followers`

- seguidores aprobados pueden ver el resumen compartible.

`progressVisibility = household`

- solo miembros del mismo household pueden ver el progreso compartido.

Para el MVP, se puede limitar la primera implementación a:

```text
progress_visibility = private | household
```

y dejar `followers` como feature flag si todavía no se quiere exponer progreso a terceros.

---

# 6. Búsqueda de usuarios

## 6.1 Nueva ruta recomendada

Agregar:

```text
/app/people
```

o:

```text
/app/community
```

Elegir **`/app/people`** para la primera versión porque es neutral y directo.

La página debe ser `PeoplePage.tsx`.

## 6.2 Casos de búsqueda

El input debe aceptar:

```text
@facundo
facundo
Facundo Aranda
TT-7K4M9P
```

Normalizar:

- trim;
- lower-case para matching de handle/code;
- quitar `@` inicial;
- no transformar códigos en UUID.

## 6.3 Resultado de búsqueda

Card visual:

```text
┌──────────────────────────────────────┐
│ [avatar]                            │
│ Facundo                              │
│ @facundo                             │
│ TT-7K4M9P                            │
│                                      │
│ 12 entrenamientos · 9 días de racha │
│                                      │
│ [Ver perfil] [Seguir] [Agregar]      │
└──────────────────────────────────────┘
```

### Estados del CTA

El botón no siempre debe decir "Seguir".

Estados posibles:

```text
Seguir
Solicitud enviada
Siguiendo
En tu household
Invitación enviada
No disponible
```

No permitir acciones inconsistentes.

---

# 7. API/repositorio de people

Extender `src/lib/repository.ts` o crear un módulo dedicado:

```text
src/lib/people.ts
```

Preferencia:

```text
src/lib/people.ts
```

para aislar la lógica de descubrimiento/social.

## 7.1 Contrato

Crear tipos:

```ts
interface PublicProfile {
  id: string
  handle: string
  publicCode: string
  displayName: string
  firstName?: string
  avatarUrl?: string
  discoverable: boolean
  progressVisibility: ProgressVisibility
}

interface ProfileSearchResult {
  profile: PublicProfile
  relationship: RelationshipState
  householdState: HouseholdRelationshipState
}

type RelationshipState =
  | "none"
  | "requested"
  | "following"
  | "blocked"

type HouseholdRelationshipState =
  | "none"
  | "same_household"
  | "invitation_pending"
  | "invited"
```

## 7.2 Métodos

Implementar:

```ts
searchPublicProfiles(query)
getPublicProfileByHandle(handle)
getPublicProfileByCode(code)
sendFollowRequest(targetUserId)
acceptFollowRequest(requestId)
declineFollowRequest(requestId)
removeFollower(userId)
unfollow(userId)
getRelationship(targetUserId)
getMyFollowers()
getMyFollowing()
```

Y para household:

```ts
inviteUserToHousehold(targetUserId, householdId)
acceptHouseholdInvitation(invitationId)
declineHouseholdInvitation(invitationId)
cancelHouseholdInvitation(invitationId)
```

---

# 8. Relación social: `profile_follows`

No reutilizar `couple_members` para representar seguimiento.

Crear:

```sql
profile_follows
```

Propuesta mínima:

```sql
id uuid primary key default gen_random_uuid()
follower_id uuid not null references profiles(id) on delete cascade
followed_id uuid not null references profiles(id) on delete cascade
status text not null default 'pending'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
accepted_at timestamptz null
```

Estados:

```text
pending
accepted
rejected
blocked
```

Constraint:

```sql
unique (follower_id, followed_id)
```

Y:

```sql
check (follower_id <> followed_id)
```

No permitir auto-follow.

## 8.1 Por qué seguir con request y no follow directo

El producto necesita preservar control sobre quién puede ver progreso.

Por defecto:

```text
Follow
↓
Request
↓
Accept
↓
Relationship = following
```

Para una futura modalidad "seguimiento público" se puede permitir auto-follow si la configuración de privacidad lo soporta.

---

# 9. Solicitudes/invitaciones: separar dos mecanismos

No mezclar:

```text
follow request
```

con:

```text
household invitation
```

Son acciones distintas.

## Follow

```text
User A → wants updates from User B
```

## Household

```text
User A → wants User B inside shared planning space
```

Por seguridad y claridad UX:

```text
Follow ≠ Household membership
Household membership ⇒ explicit shared relationship
```

---

# 10. Household Foundation

La documentación actual indica que ya existen:

```text
couples
couple_members
```

y que el esquema permite técnicamente más de dos miembros, aunque el producto original está pensado para exactamente dos. La migración debe ser no destructiva.

## 10.1 Estrategia recomendada

Crear:

```text
households
household_members
household_invitations
```

y conservar temporalmente:

```text
couples
couple_members
```

con compatibilidad.

### `households`

Propuesta:

```sql
id uuid primary key default gen_random_uuid()
name text not null
household_type text not null default 'duo'
legacy_couple_id uuid null references couples(id)
owner_user_id uuid not null references profiles(id)
max_members integer not null default 2
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Tipos iniciales:

```text
duo
```

Si el producto confirma un modo House de múltiples personas, habilitar posteriormente:

```text
house
```

con otro `max_members`, pero **no habilitarlo en UI hasta que la regla comercial esté definida**.

Esto evita inventar una cuarta suscripción en una fase donde los documentos solo definen Free/Plus/Duo.

### `household_members`

```sql
household_id uuid not null references households(id) on delete cascade
user_id uuid not null references profiles(id) on delete cascade
role text not null default 'member'
joined_at timestamptz not null default now()
left_at timestamptz null
primary key (household_id, user_id)
```

Roles iniciales:

```text
owner
member
```

---

# 11. Exactly-two para DUO

La base existente no garantiza dos miembros.

Para DUO no confiar solo en frontend.

Crear una función transaccional SQL o RPC:

```text
add_household_member()
```

que:

1. valida el household;
2. bloquea la fila/contención necesaria;
3. cuenta miembros activos;
4. valida `max_members`;
5. inserta solo si hay espacio;
6. rechaza duplicados;
7. retorna estado claro.

Para `household_type = duo`:

```text
active_members <= 2
```

No usar solamente:

```ts
if (members.length < 2)
```

porque dos pestañas simultáneas pueden generar una condición de carrera.

---

# 12. Household invitations

Crear:

```sql
household_invitations
```

Campos recomendados:

```sql
id uuid primary key default gen_random_uuid()
household_id uuid not null references households(id) on delete cascade
inviter_user_id uuid not null references profiles(id) on delete cascade
invitee_user_id uuid null references profiles(id) on delete cascade
token_hash text null
status text not null default 'pending'
expires_at timestamptz not null
accepted_at timestamptz null
revoked_at timestamptz null
created_at timestamptz not null default now()
```

Estados:

```text
pending
accepted
expired
revoked
declined
```

La documentación ya exige estados de invitación explícitos y tokens aleatorios, expirables y de un solo uso cuando corresponda.

---

# 13. Flujo: buscar → invitar → conectar

## Caso A — Usuario encontrado por handle

```text
User A
  ↓
People
  ↓
buscar "@maria"
  ↓
resultado María
  ↓
Ver perfil
  ↓
Agregar a household
  ↓
crear invitation
  ↓
María recibe solicitud
  ↓
acepta
  ↓
household_members
  ↓
ambos conectados
```

## Caso B — Usuario encontrado por public code

```text
User A
  ↓
pega TT-7K4M9P
  ↓
lookup exacto
  ↓
perfil
  ↓
Agregar / Seguir
```

## Caso C — usuario no encontrado

UI:

```text
No encontramos una cuenta con ese código.

[Compartir invitación]
```

No convertir automáticamente un texto arbitrario en una invitación insegura.

---

# 14. Perfil público

Crear:

```text
src/pages/PublicProfilePage.tsx
```

Ruta:

```text
/app/people/:handle
```

También puede resolverse por código mediante:

```text
/app/people/code/:publicCode
```

pero preferir una única ruta canónica si es posible:

```text
/app/people/:identifier
```

donde el backend resuelva handle o public code.

## 14.1 Diseño

Header:

```text
[Avatar]

Display Name
@handle
TT-code

[Seguir] [Agregar al household]
```

Sección de progreso visible:

```text
PROGRESO COMPARTIDO

12 workouts
8,432 steps avg.
7 day streak
3 PRs
```

Mostrar solo campos permitidos por la política de visibilidad.

## 14.2 Copy

No usar lenguaje de competencia:

```text
"superarlo"
"ganarle"
"quién entrenó más"
```

Usar:

```text
"acompañarse"
"seguir juntos"
"ver cómo va"
"mantenerse consistentes"
```

Esto coincide con la orientación de la documentación de evitar presentar el progreso de pareja como competición.

---

# 15. Modelo de seguimiento de progreso

Crear una capa explícita de permisos.

Propuesta:

```ts
interface ProgressShareSettings {
  showWorkoutCompletion: boolean
  showStreak: boolean
  showWeeklyVolume: boolean
  showSteps: boolean
  showPersonalRecords: boolean
  showNutritionAdherence: boolean
}
```

No permitir que el componente `CouplePage` acceda arbitrariamente a cualquier columna.

## Backend

Crear una tabla opcional:

```sql
progress_share_settings
```

o incluir los campos en `profiles`.

Recomendación para MVP:

```text
profiles.progress_visibility
profiles.shared_progress_mask
```

con JSONB únicamente si el contrato queda tipado y validado.

Si se necesita mayor auditabilidad, usar tabla dedicada.

---

# 16. Regla de privacidad obligatoria

El sistema nunca debe aplicar:

```text
same household → all data visible
```

La regla debe ser:

```text
own data
OR
resource explicitly household-visible
OR
public summary explicitly allowed
```

Mantener la separación documentada:

### Private

- body weight
- private comments
- personal strategy
- private progress details
- private nutrition logs

### Household

- shared recipes
- shared meals
- grocery
- household shopping
- shared activity
- couple summaries

La documentación ya establece explícitamente que los Food Logs deben permanecer privados salvo `visibility = household`.

---

# 17. RLS para People

Crear políticas para:

## `profiles`

Permitir `select` de perfiles:

```text
own profile
OR
discoverable = true
OR
explicit household relationship
OR
explicit follow relationship
```

Pero devolver datos mínimos para perfiles públicos.

Idealmente usar una view segura:

```sql
public_profiles
```

en lugar de exponer todas las columnas de `profiles`.

### View conceptual

```sql
create view public_profiles as
select
  id,
  public_handle,
  public_code,
  display_name,
  first_name,
  avatar_url,
  discoverable
from profiles
where active = true
  and discoverable = true;
```

La búsqueda debe utilizar esta view o un RPC de búsqueda que exponga únicamente esos campos.

## No exponer

- email;
- internal auth fields;
- private nutrition;
- weight;
- internal IDs salvo lo estrictamente necesario para joins internos.

---

# 18. RPC segura de búsqueda

Recomendado:

```text
search_public_profiles(search_query text, result_limit integer)
```

Comportamiento:

1. normalizar input;
2. detectar code exacto;
3. detectar handle exacto;
4. detectar prefijo;
5. ordenar por relevancia;
6. limitar resultados;
7. excluir usuario actual;
8. excluir perfiles `discoverable = false`.

Resultado:

```ts
{
  id,
  publicHandle,
  publicCode,
  displayName,
  firstName,
  avatarUrl
}
```

Nunca retornar toda la fila de `profiles`.

---

# 19. Seguridad del public code

El código debe:

- generarse en backend/SQL;
- ser suficientemente aleatorio;
- no ser derivable del UUID;
- no exponer información temporal;
- poder copiarse fácilmente;
- ser estable durante la vida normal de la cuenta.

Ejemplo:

```text
TT-7K4M9P
```

No:

```text
USER-000123
```

No:

```text
UUID
```

---

# 20. Nueva sección en ProfilePage

La documentación actual de `ProfilePage` ya muestra nombre, métricas y preferencias. La nueva versión debe añadir un bloque de identidad.

## UI

```text
YOUR PROFILE
────────────

[Avatar]

Facundo
@facundo

Your Train Together ID
TT-7K4M9P

[Copy ID]
[Share profile]
```

Debajo:

```text
DISCOVERY

[x] Allow people to find me by my handle
[x] Allow people with my Train Together ID to find me
```

Y:

```text
PROGRESS VISIBILITY

( ) Private
( ) Household
```

Para MVP evitar `followers` si no se quiere abrir esa superficie de privacidad.

---

# 21. Nueva navegación

Agregar una entrada al `AppShell`:

```text
People
```

Icono sugerido:

```text
UsersRound
```

Orden recomendado:

```text
Dashboard
Strategy
Live Training
Progress
History
People
Couple / Household
...
Profile
```

En móvil, incluir `People` en navegación secundaria o dentro de menú para no saturar la bottom navigation.

---

# 22. CouplePage → HouseholdPage

No mantener conceptualmente `CouplePage` como si el producto tuviera automáticamente una pareja conocida.

Evolucionar a:

```text
src/pages/HouseholdPage.tsx
```

Se puede conservar el archivo viejo temporalmente y exportar/reutilizar, pero el dominio debe pasar a llamarse household.

Ruta recomendada:

```text
/app/household
```

y mantener:

```text
/app/couple
```

como redirect de compatibilidad mientras exista código externo que dependa de esa ruta.

## Estado vacío

Cuando no hay household:

```text
Build your household

Connect with someone and start planning together.

[Find someone]
[Invite by code]
```

## Household con un miembro

```text
YOUR HOUSEHOLD

Facundo
Owner

Waiting for member...

[Find someone]
[Copy invite]
```

## Household completo

```text
YOUR HOUSEHOLD

Facundo              María
@facundo              @maria

✓ Connected

[View shared progress]
[Weekly plan]
[Groceries]
```

---

# 23. Add-to-household modal

Crear componente:

```text
src/components/AddToHouseholdModal.tsx
```

Casos de uso:

- desde People search;
- desde Public Profile;
- desde Household vacío;
- desde onboarding;
- desde pricing/DUO CTA.

Contenido:

```text
Add María to your household?

María
@maria
TT-9J2Q4L

This will allow you to coordinate:
✓ shared progress
✓ shared meals
✓ recipes
✓ groceries

Private data remains private.

[Cancel] [Send invitation]
```

Esto evita que el usuario piense que "agregar" inmediatamente concede acceso a todo.

---

# 24. Diferenciar "Follow" y "Add"

En el perfil:

```text
[Follow]
[Add to household]
```

No usar un único botón ambiguo:

```text
Connect
```

porque el producto necesita dos relaciones diferentes.

### Follow

Actualizaciones y relación social.

### Add to household

Invitación estructural.

---

# 25. Onboarding actualizado

El documento de monetización ya define:

```text
Google
↓
Welcome
↓
Goal
↓
Profile
↓
Create / Join Household
↓
Invite Partner
↓
Strategy
↓
Nutrition
↓
First Week
↓
Grocery
```

Extenderlo a:

```text
Google
↓
Welcome
↓
Goal
↓
Basic Profile
↓
Public Identity
   - handle
   - Train Together ID
   - visibility
↓
Create / Join Household
   ↓
[Create]
     OR
[Find someone]
     OR
[Enter invite code]
↓
Invite / request
↓
Strategy
↓
Nutrition Strategy
↓
First Week
↓
Grocery
↓
AHA
```

## Importante

El usuario debe poder saltar el household sin quedar bloqueado:

```text
Skip for now
```

porque la documentación dice que onboarding es progresivo.

---

# 26. UX de búsqueda dentro del onboarding

Cuando el usuario elige:

```text
Join / connect
```

mostrar:

```text
Find your person

Search by:
@username
name
Train Together ID

[ Search ]
```

Resultado:

```text
María
@maria
TT-9J2Q4L

[Add to household]
```

Segundo mecanismo:

```text
Have an invite?
[Enter code]
```

Esto cubre tanto descubrimiento visual como invitación directa.

---

# 27. Invitación basada en búsqueda

Cuando se selecciona un perfil, generar una invitación dirigida.

```text
household_invitations.invitee_user_id = target
```

El destinatario debe ver:

```text
María invited you to join "Train Together"

[Accept]
[Decline]
```

Al aceptar:

```text
validate invitation
↓
validate household capacity
↓
insert household_members
↓
mark invitation accepted
↓
recalculate household access
↓
publish Realtime household event
```

Todo debe ejecutarse transaccionalmente donde sea posible.

---

# 28. Invitación por código compartible

Además del profile code, mantener un código específico de invitación.

No utilizar:

```text
TT public code
```

como si fuera una invitación con permisos.

Son conceptos distintos:

```text
public_code
    → identifica una cuenta

invite_token
    → autoriza una acción concreta
```

El token de invitación debe ser:

- aleatorio;
- expirado;
- single-use cuando corresponda;
- almacenado hasheado si se transporta como bearer token;
- no derivable del user ID.

---

# 29. Realtime para Social + Household

La documentación ya indica canales:

```text
fitness
nutrition
household
subscription
```

Agregar explícitamente:

```text
people
```

solo si se justifica; para la primera versión se puede agrupar solicitudes sociales dentro de:

```text
household
```

o crear:

```text
social
```

Recomendación:

```text
fitness
nutrition
household
social
subscription
```

## Eventos mínimos

```text
follow_request_created
follow_request_accepted
follow_request_declined
household_invitation_created
household_invitation_accepted
household_member_joined
household_member_left
progress_visibility_changed
profile_public_identity_changed
```

---

# 30. Realtime: no hacer full refresh

La documentación marca como problema actual:

```text
cada evento → refreshFromRemote()
```

La nueva implementación debe evolucionar hacia:

```text
Realtime event
    ↓
identify entity
    ↓
update affected context/cache
```

Ejemplo:

```text
household_member_joined
↓
actualizar household.members
↓
actualizar People relationship
↓
resolver entitlements
↓
refrescar solo la vista afectada
```

No descargar nuevamente toda la aplicación por cada follow request.

---

# 31. Subscription + household relationship

El contexto de acceso debe ser similar a:

```ts
type AccessContext = {
  userId: string
  householdId: string | null
  plan: "free" | "plus" | "duo"
  status: SubscriptionStatus
  entitlements: Entitlements
}
```

Resolver con:

```ts
resolveEntitlements(user, household, subscriptions)
```

Precedencia documentada:

```text
household Duo
>
individual Plus
>
Free
```

---

# 32. Regla para convertir un household Free en Duo

El flujo:

```text
User A
↓
household exists
↓
member B exists
↓
Upgrade to Duo
↓
checkout
↓
verified webhook
↓
household.plan = duo
↓
both members get Duo entitlements
```

Nunca crear una segunda suscripción para B.

---

# 33. Caso de selección de usuario al comprar DUO

La experiencia comercial debe aprovechar la nueva búsqueda.

CTA:

```text
Upgrade to Duo
```

Si no hay segundo miembro:

```text
Duo is built for two.

Add someone to your household.

[Find your person]
[Invite with code]
```

Si ya existe segundo miembro:

```text
You're ready for Duo.

Facundo + María
2 household members

[Upgrade household]
```

No hacer checkout de Duo antes de confirmar que el household puede tener la composición requerida.

---

# 34. Caso: usuario con Plus descubre a otro usuario

Puede:

- seguirlo;
- invitarlo a household;
- mantener su Plus individual.

Si luego entra a un household Duo:

```text
household Duo
>
individual Plus
```

Pero la suscripción individual Plus no debe borrarse de la base.

La documentación exige conservar el registro y separar "business behavior" de "access calculation".

---

# 35. Caso: partner leaves

Al abandonar:

```text
household_members.left_at
```

o eliminación física según política.

Pero antes debe evaluarse:

- quién es owner;
- quién paga;
- qué sucede con shared recipes;
- grocery;
- Duo;
- invitaciones pendientes.

No borrar silenciosamente datos compartidos.

---

# 36. Pricing / landing — cambio de narrativa

La landing actual debe dejar de parecer una landing de "workout tracker".

El orden narrativo debe ser:

```text
Goals
↓
Train
↓
Eat
↓
Plan
↓
Shop
↓
Do it together
```

La documentación comercial define la propuesta como un sistema compartido de fitness y nutrición, no como una colección de features.

---

# 37. Landing Hero refinado

## Desktop

Left:

```text
TRAIN TOGETHER.
GROW TOGETHER.

Plan your workouts, organize your meals,
stay on track and build your week together.

[Start for free]
[See how it works]
```

Right:

un preview real de aplicación.

## Nueva preview recomendada

No mostrar solo:

```text
Workout
```

Mostrar:

```text
TODAY

Facundo
Leg Day ✓
1,840 kcal / 2,200
8,432 steps / 10,000

María
Meal plan ✓
Workout 80%

HOUSEHOLD
3 shared recipes
1 grocery list
2 connected profiles

[View shared progress]
```

Esto explica inmediatamente qué hace distinto al producto.

---

# 38. Nueva sección de "Find your people"

Agregar entre el producto y pricing:

```text
FIND YOUR PEOPLE

Find someone by name, @handle or Train Together ID.

[ Search @username or TT-code ]

María
@maria
TT-9J2Q4L

[View profile]
[Follow]
```

No debe ser una herramienta funcional real dentro de la landing pública si eso expondría usuarios.

### En landing

Usar mockup visual.

### En app autenticada

Usar búsqueda real.

---

# 39. Landing — narrativa de conexión

Nueva sección:

```text
BETTER TOGETHER

Find each other.
Connect your accounts.
See progress.
Plan the week.
Stay consistent.
```

Flujo visual:

```text
[User A]
   ↓ search
[@user]
   ↓
[User B profile]
   ↓ invite
[Household]
   ↓
[Shared progress]
```

Visualmente debe quedar claro que:

```text
discovery
→ connection
→ household
→ shared progress
```

es un flujo principal del producto.

---

# 40. Landing — Couple/Duo

Mantener:

```text
Everything you need. For both of you.

One plan. Two people. One shared week.
```

Pero agregar:

```text
Find each other by name, handle or Train Together ID.
Then turn the connection into a shared household.
```

Esto convierte el concepto de Duo en algo accionable.

---

# 41. Landing — pricing

Mostrar:

```text
FREE
$0

PLUS
US$7.99/mo
US$59.99/year

DUO
US$11.99/mo
US$89.99/year
★ MOST POPULAR
```

Estos precios siguen siendo hipótesis configurables, no verdades de negocio.

No hardcodear las cadenas en `LandingPage.tsx`.

---

# 42. Landing — feature cards

Recomendar cuatro bloques:

### TRAIN

```text
Plan and execute workouts.
```

### EAT

```text
Track meals, recipes and nutrition.
```

### PLAN

```text
Turn goals into an organized week.
```

### TOGETHER

```text
Find your person, connect your profiles
and stay coordinated.
```

---

# 43. Landing — weekly system

Mantener la sección:

```text
STOP PLANNING YOUR LIFE ONE DAY AT A TIME.
```

Pero la visual debe incluir:

```text
Workout
Meal
Grocery
Partner
```

por semana.

Ejemplo:

```text
MON
✓ Workout
✓ Meals
✓ Partner progress

TUE
✓ Workout
✓ Meal plan

WED
...
```

---

# 44. Landing — product previews

El hero/previews animados deben rotar sutilmente entre:

```text
Workout
Nutrition
Meal Plan
Grocery
People / Profile
Couple Progress
```

No crear un carrusel agresivo.

La documentación ya recomienda CSS + Framer Motion + assets optimizados.

---

# 45. Landing — CTA

Primary:

```text
Start for free
```

Secondary:

```text
See how it works
```

Después del click:

```text
Continue with Google
```

No mostrar username/password en el funnel SaaS público.

---

# 46. Landing — FAQ nuevo

Añadir:

### Can I find someone without knowing their email?

Sí. La aplicación puede utilizar el nombre, handle o Train Together ID según la configuración de descubrimiento.

### Does following someone share my private data?

No. Follow y household sharing son relaciones distintas.

### What happens when I add someone to Duo?

El household pasa a tener dos miembros y ambos reciben las entitlements de Duo según la suscripción.

### Can I keep my private nutrition data private?

Sí. Los datos privados siguen bajo control del propietario salvo que se compartan explícitamente.

### What is my Train Together ID?

Es un código público estable que permite localizar tu perfil sin exponer tu UUID interno.

No afirmar cosas que aún no existan en el backend productivo.

---

# 47. Landing — no fake social proof

No introducir:

```text
"10,000 couples..."
```

ni testimonios inventados.

La documentación explícitamente prohíbe fabricar social proof.

---

# 48. Componentes nuevos

Crear o evolucionar:

```text
src/pages/PeoplePage.tsx
src/pages/PublicProfilePage.tsx
src/pages/HouseholdPage.tsx

src/components/people/ProfileSearch.tsx
src/components/people/PublicProfileCard.tsx
src/components/people/ProfileIdentityBadge.tsx
src/components/people/RelationshipActions.tsx
src/components/people/FollowRequestList.tsx

src/components/household/AddToHouseholdModal.tsx
src/components/household/HouseholdMemberCard.tsx
src/components/household/HouseholdInviteBanner.tsx
src/components/household/HouseholdEmptyState.tsx

src/components/social/ProgressVisibilityControl.tsx
src/components/social/SharedProgressSummary.tsx
```

Reutilizar `ui/index.tsx` y componentes existentes donde sea posible.

---

# 49. Contexts/hooks

No meter todo dentro de `FitnessContext`.

Crear:

```text
src/contexts/PeopleContext.tsx
src/contexts/HouseholdContext.tsx
src/contexts/SubscriptionContext.tsx
```

o hooks con servicios si el proyecto prefiere una arquitectura más liviana.

### PeopleContext

Responsabilidades:

- search;
- relationships;
- follow requests;
- public profile state.

### HouseholdContext

Responsabilidades:

- current household;
- members;
- invitation status;
- household role;
- household type;
- shared capabilities.

### SubscriptionContext

Responsabilidades:

- AccessContext;
- plan;
- subscription status;
- entitlements.

No hacer que `ProfilePage` consulte directamente Stripe/Supabase de billing.

---

# 50. Types

Extender:

```text
src/types/index.ts
src/types/database.ts
```

Agregar:

```ts
type PlanCode = "free" | "plus" | "duo"

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired"

type HouseholdType = "duo" | "house"

type HouseholdRole = "owner" | "member"

type InvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked"
  | "declined"

type RelationshipState =
  | "none"
  | "requested"
  | "following"
  | "blocked"

type ProfileVisibility =
  | "private"
  | "discoverable"

type ProgressVisibility =
  | "private"
  | "household"
```

`"house"` solo debe activarse si el producto realmente lo utiliza.

---

# 51. Migraciones

Agregar migraciones versionadas, nunca editar destructivamente las anteriores.

Orden recomendado:

```text
20260903...._public_profile_identity.sql
20260903...._profile_discovery.sql
20260903...._household_foundation.sql
20260903...._household_invitations.sql
20260903...._social_follows.sql
20260903...._progress_visibility.sql
20260903...._rls_social_household.sql
20260903...._realtime_social_household.sql
20260903...._subscription_foundation.sql
20260903...._entitlements.sql
```

Los timestamps concretos deben seguir la convención real del repo y no deben ser inventados si el agente ya ve otras migraciones posteriores.

---

# 52. Compatibilidad con `couples`

Crear un mapping inicial:

```text
couples.id
    ↓
households.legacy_couple_id
```

Migrar miembros:

```text
couple_members
    ↓
household_members
```

No borrar todavía `couples` ni `couple_members`.

Tras validar producción y tests, documentar un eventual deprecation path.

---

# 53. Repository changes

Actualizar:

```text
src/lib/repository.ts
```

para separar:

```text
loadRemoteState()
```

de:

```text
loadCurrentHousehold()
loadPublicProfile()
searchProfiles()
loadFollowRequests()
```

No meter People en el `AppState` global salvo que realmente sea necesario.

Preferir estado contextual.

---

# 54. Demo mode

El modo demo debe seguir funcionando.

Agregar demos:

```text
Fabricio
María
```

con:

```text
publicHandle
publicCode
discoverable
household
relationship
```

Ejemplo:

```text
Fabricio
@fabricio
TT-FAB123

María
@maria
TT-MAR456
```

Estos valores deben ser claramente de demo.

No tratarlos como IDs productivos reales.

---

# 55. Demo scenarios obligatorios

Preparar al menos:

### Scenario 1

```text
Fabricio busca María
→ encuentra
→ abre perfil
→ envía follow
```

### Scenario 2

```text
Fabricio busca María
→ Add to household
→ invitation pending
```

### Scenario 3

```text
María acepta
→ household tiene 2 members
→ Duo elegible
```

### Scenario 4

```text
Fabricio ve progreso compartido
→ entrenamiento
→ racha
→ volumen
```

### Scenario 5

```text
María cambia visibility
→ Fabricio pierde acceso al dato privado
```

### Scenario 6

```text
Duo expires
→ ambos Free
→ datos históricos intactos
```

---

# 56. Premium gating

Crear componentes:

```text
PremiumGate
UpgradeModal
PlanComparison
```

y ahora también:

```text
DuoGate
HouseholdGate
```

Pero `DuoGate` debe consultar entitlement:

```ts
can("couple.sharedPlanning")
```

y no:

```ts
plan === "duo"
```

---

# 57. Gating correcto de "Add to household"

El descubrimiento puede estar disponible para Free.

La acción:

```text
Add to household
```

también puede existir en Free porque la documentación quiere que Free pruebe el valor del household.

Premium debe aumentar:

- profundidad;
- automatización;
- coordinación;
- history;
- analytics.

No bloquear el concepto entero antes del pago.

---

# 58. Gating del progreso

### Free

```text
Basic shared progress
```

### Plus

```text
Individual advanced progress
```

### Duo

```text
Full couple/household progress
```

### Importante

El acceso a progreso debe depender de:

```text
relationship
+
visibility
+
entitlement
```

No solo del plan.

---

# 59. Cálculo de progreso compartido

Reutilizar:

```text
getCoupleSummaries()
calculateDashboardStats()
calculateCurrentStreak()
calculateSessionVolume()
calculateAdherence()
```

pero parametrizados por `userId` y un contexto de autorización.

Ejemplo:

```ts
getVisibleProgress({
  viewerId,
  subjectId,
  relationship,
  visibility,
  accessContext,
})
```

El resultado debe tener únicamente los campos autorizados.

---

# 60. No exponer AppState del otro usuario

El patrón actual:

```text
profiles[]
sessions[]
dailyMetrics[]
personalRecords[]
```

es demasiado amplio para el concepto de profile discovery.

No retornar a People:

```text
full sessions
full food logs
full strategy
full metrics
```

Construir DTOs/resúmenes.

Ejemplo:

```ts
interface SharedProgressSummary {
  workoutsCompleted: number
  currentStreak: number
  weeklyVolume: number
  stepsProgress?: number
  personalRecordsCount?: number
}
```

---

# 61. Shared Progress: selección de campos

Para el MVP:

```text
workoutsCompleted
currentStreak
weeklyVolume
personalRecordsCount
stepGoalProgress
```

No compartir automáticamente:

```text
weight
calories eaten
protein
private notes
pain
RPE
```

salvo que el modelo de producto defina explícitamente que esos campos son household-visible.

---

# 62. Privacy UX

Toda acción de privacidad debe explicar consecuencias.

Ejemplo:

```text
Make progress visible to your household?

Your household members will be able to see:
✓ completed workouts
✓ streak
✓ weekly volume

They will not see:
✓ private food logs
✓ body weight
✓ private notes
```

Esto reduce sorpresas y es consistente con la exigencia de no inferir visibilidad.

---

# 63. Profile page: social management

Añadir secciones:

```text
YOUR IDENTITY
Your handle
Your Train Together ID

DISCOVERY
Who can find you

PROGRESS
Who can see your progress

CONNECTIONS
Followers
Following
Household
```

---

# 64. Household page: visual identity

Mostrar claramente:

```text
HOUSEHOLD
Train Together

2 / 2 members
```

y no:

```text
Couple #123
```

La UI debe empezar a reflejar la abstracción nueva incluso antes de que `couples` desaparezca internamente.

---

# 65. Account states

Soportar:

```text
new_user
onboarding
active
```

y además:

```text
no_household
household_pending
household_active
```

No inferir onboarding solo por existencia de sesión.

---

# 66. Navigation flows

### Visit root

```text
/
↓
Landing
```

### CTA

```text
Start for free
↓
Google
↓
if profile incomplete
    onboarding
else
    /app
```

### Invite link

```text
invite URL
↓
auth
↓
resolve invitation
↓
show invite preview
↓
accept
↓
household
```

### Public profile within app

```text
/app/people/:identifier
```

### Household

```text
/app/household
```

---

# 67. URL/security rules

No usar query params para transportar:

```text
private user IDs
```

No incluir:

```text
?userId=<uuid>
```

como mecanismo de acceso.

Usar:

```text
/app/people/@maria
```

o código público.

La autorización real debe continuar siendo backend/RLS.

---

# 68. Generated Supabase types

Implementar lo pedido en el brief:

```bash
yarn db:types
```

o equivalente real del repositorio.

Después de cada migración:

```text
generate types
→ update database.ts
→ typecheck
```

Usar:

```ts
SupabaseClient<Database>
```

para reducir pérdida de seguridad de tipos.

---

# 69. RLS test matrix

Agregar tests DB para:

## Profiles

- user sees own profile;
- discoverable profile visible;
- non-discoverable profile hidden;
- public view hides private columns.

## Follow

- cannot create self-follow;
- can request public user;
- recipient can accept/reject;
- unrelated user cannot mutate other request.

## Household

- member sees household;
- non-member does not;
- owner can invite;
- member can see eligible shared resources;
- max members enforced;
- second concurrent join cannot overflow Duo.

## Private data

- follower cannot see private Food Log;
- same household cannot see private Food Log unless explicitly household-visible;
- shared progress DTO excludes private fields.

## Subscription

- Duo entitlements only for active household members;
- expired Duo loses premium capabilities;
- data remains.

---

# 70. RLS strategy

Prefer helpers:

```sql
is_household_member(household_id, auth.uid())
```

y:

```sql
can_view_public_profile(profile_id, auth.uid())
```

y:

```sql
can_view_shared_progress(profile_id, auth.uid())
```

No repetir veinte veces la misma lógica SQL.

---

# 71. Realtime subscription state

La documentación actual considera insuficiente el indicador de conexión.

Implementar estados:

```text
connecting
connected
reconnecting
error
offline
```

y exponerlos en un servicio central.

El AppShell no debe decir:

```text
Connected
```

solo porque existe configuración de Supabase.

---

# 72. Persistencia robusta

La documentación actual indica `fireRemote()` como fire-and-forget y errores solo en `console.warn`.

Para las nuevas entidades sensibles:

```text
follow
household invitation
household membership
subscription
```

no usar fire-and-forget sin feedback.

El usuario debe ver:

```text
Sending...
Sent
Failed — Retry
```

Los formularios no deben perder el estado.

---

# 73. Analytics de producto

Además de los eventos existentes:

```text
signed_up
profile_completed
household_created
partner_invited
partner_joined
...
```

añadir:

```text
profile_discovery_enabled
profile_search
profile_viewed
follow_request_sent
follow_request_accepted
household_invitation_from_profile
household_invitation_accepted
progress_viewed
progress_visibility_changed
duo_upgrade_started
duo_upgrade_completed
```

No almacenar contenido privado innecesario.

---

# 74. Activation events

El evento de alto valor debe evolucionar a:

```text
profile_completed
+
public_identity_configured
+
household_joined
+
partner_joined
+
strategy_completed
+
first_week_planned
+
first_grocery_list_generated
```

Crear un evento agregado:

```text
aha_moment_reached
```

cuando corresponda.

---

# 75. Métrica North Star

Mantener:

```text
Weekly Active Households
```

definida como:

```text
household con al menos una acción planificada significativa completada durante la semana
```

y segmentar:

```text
solo usuario
household con 2 personas
Duo paid
```

La búsqueda/follow no debe convertirse en la North Star por sí misma; su objetivo es ayudar a activar y retener households.

---

# 76. Landing: visual system

Mantener la estética existente:

- dark;
- glassmorphism;
- neon;
- purple accent;
- Framer Motion.

Pero evitar convertir todo en cards flotantes idénticas.

El nuevo sistema visual debe tener jerarquía:

```text
Hero = product preview
Sections = product narrative
Duo = stronger accent
Pricing = conversion
FAQ = trust
```

---

# 77. Landing: responsive

Verificar obligatoriamente:

```text
360
390
430
768
1024
1280
1440+
```

En móvil:

- hero apilado;
- product preview debajo;
- pricing cards verticales;
- search/profile mockup legible;
- CTA siempre accesible;
- no overflow horizontal.

---

# 78. Landing: accessibility

Cumplir:

- headings semánticos;
- keyboard navigation;
- focus visible;
- reduced motion;
- alt text;
- aria-labels;
- contraste;
- botones descriptivos.

Para mocks de perfiles, no usar información que parezca una cuenta real si no es demo.

---

# 79. Internationalization

Todo texto nuevo debe entrar en:

```text
ES
EN
```

Nunca:

```tsx
<button>Follow</button>
```

directamente dentro del componente.

Usar claves:

```text
people.follow
people.following
people.addToHousehold
people.searchPlaceholder
people.publicCode
household.invite
household.sharedProgress
```

---

# 80. Reutilizar copy de negocio

Mantener conceptos:

```text
Build your week.
Plan together.
Know what's next.
```

y añadir:

```text
Find your person.
Connect your profiles.
Follow progress together.
```

No utilizar:

```text
Track your partner secretly.
```

ni lenguaje de vigilancia.

---

# 81. Pricing UI dentro de app

En Profile/Settings:

```text
Current plan
Trial status
Renewal date
Manage subscription

Household
2 members
Duo status
```

En Duo:

```text
HOUSEHOLD PLAN
DUO
2 members
```

---

# 82. Billing abstractions

Crear:

```text
src/lib/billing/
  types.ts
  provider.ts
  stripe.ts
  mock.ts
  subscription.ts
```

Con:

```ts
interface BillingProvider {
  createCheckoutSession(...)
  createCustomerPortalSession(...)
  cancelSubscription(...)
  changePlan(...)
  getSubscriptionStatus(...)
}
```

No meter Stripe dentro de React components.

---

# 83. No billing real requerido en esta fase

Mantener desarrollo sin credenciales Stripe.

Usar:

```text
mock/local provider
```

solo para desarrollo.

No fingir que un pago real ocurrió.

La fuente de verdad productiva será:

```text
provider
→ webhook
→ backend
→ subscriptions
→ entitlements
```

---

# 84. Webhooks

Arquitectura:

```text
Stripe
 ↓
Webhook
 ↓
verify signature
 ↓
normalize event
 ↓
idempotency check
 ↓
update subscription
 ↓
resolve entitlements
 ↓
Realtime
```

Persistir:

```text
subscription_events
```

con:

```text
provider_event_id unique
```

Procesar un evento dos veces no debe duplicar:

- subscription;
- entitlement;
- event effect.

---

# 85. Plan precedence

Implementar una sola función:

```ts
resolveEntitlements(...)
```

Casos:

```text
Free
→ Free

Plus
→ Plus

Duo household
→ Duo

Plus individual + Duo household
→ Duo access
```

No eliminar el Plus individual al calcular acceso.

---

# 86. Feature flags

Usar flags para features nuevas como:

```text
peopleDiscovery
socialFollowing
advancedProgressSharing
householdTypeHouse
```

Esto permite activar gradualmente sin nueva migration solo para esconder UI.

---

# 87. Archivos a modificar — mínimo esperado

### Core

```text
src/App.tsx
src/index.css
src/i18n.ts
src/types/index.ts
src/types/database.ts
src/lib/repository.ts
src/lib/supabase.ts
src/lib/analytics.ts
```

### Auth/context

```text
src/contexts/AuthContext.tsx
src/contexts/FitnessContext.tsx
```

Agregar nuevos contexts solo cuando sea necesario.

### Navigation/layout

```text
src/layouts/AppShell.tsx
```

### Pages

```text
src/pages/LandingPage.tsx
src/pages/ProfilePage.tsx
src/pages/CouplePage.tsx
```

y nuevos:

```text
src/pages/PeoplePage.tsx
src/pages/PublicProfilePage.tsx
src/pages/HouseholdPage.tsx
```

### Components

Agregar los de People, Household y Shared Progress.

### SQL

Agregar nuevas migrations.

### Tests

Agregar:

```text
tests/people.test.ts
tests/household.test.ts
tests/subscription.test.ts
tests/progress-sharing.test.ts
```

y DB tests SQL.

---

# 88. Orden exacto de implementación

## FASE 0 — AUDIT

Antes de tocar código:

1. leer completa `DOCUMENTACION_TECNICA(2).md`;
2. leer completa `TRAIN_TOGETHER_MONETIZATION_FOUNDATION_PROMPT(2).md`;
3. inspeccionar `src/`;
4. inspeccionar todas las migrations;
5. inspeccionar RLS;
6. inspeccionar seeds;
7. inspeccionar i18n;
8. inspeccionar landing;
9. inspeccionar CouplePage/ProfilePage;
10. inspeccionar tests;
11. ejecutar baseline:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

Guardar estado baseline.

### Entregable

Crear:

```text
AUDIT_SAAS_BASELINE.md
```

con:

- estado real;
- discrepancias doc/código;
- riesgos;
- archivos tocados;
- migraciones existentes;
- tabla de RLS;
- decisiones no tomadas.

---

## FASE 1 — DOMAIN CONTRACTS

Definir:

- PlanCode
- SubscriptionStatus
- Entitlements
- HouseholdType
- HouseholdRole
- InvitationStatus
- RelationshipState
- ProfileVisibility
- ProgressVisibility
- PublicProfile
- SharedProgressSummary
- AccessContext

No construir UI todavía.

### Exit criteria

Typecheck pasa.

---

## FASE 2 — PUBLIC IDENTITY

Implementar:

- migration;
- public handle;
- public code;
- discoverable;
- RLS/view;
- generated types;
- ProfilePage identity section;
- demo seed.

### Exit criteria

Un usuario puede:

```text
ver su handle
ver su TT-code
copiarlo
modificar discoverability
```

---

## FASE 3 — PEOPLE SEARCH

Implementar:

- search RPC/view;
- PeoplePage;
- search component;
- result card;
- PublicProfilePage;
- route;
- relationship status.

### Exit criteria

```text
@handle
name
TT-code
```

resuelven correctamente sin exponer campos privados.

---

## FASE 4 — FOLLOW

Implementar:

- `profile_follows`;
- RLS;
- repository;
- PeopleContext;
- request/accept/reject;
- notifications/Realtime mínimo;
- Profile UI.

### Exit criteria

Two-user manual test:

```text
A sends request
B receives
B accepts
A sees following
```

---

## FASE 5 — HOUSEHOLD FOUNDATION

Implementar:

- households;
- household_members;
- migration from couples;
- household invitation;
- capacity;
- ownership;
- RLS;
- HouseholdContext.

### Exit criteria

No UI assumption based on "other profile".

---

## FASE 6 — HOUSEHOLD UX

Implementar:

- `/app/household`;
- empty state;
- pending invite;
- members;
- AddToHouseholdModal;
- join/leave;
- invite from profile;
- backward route `/app/couple`.

---

## FASE 7 — SHARED PROGRESS

Implementar:

- visibility model;
- progress DTO;
- authorization function;
- Couple/Household summary;
- profile visibility controls;
- no private data leakage.

### Exit criteria

Household member sees allowed summary only.

Non-member cannot see it.

Follower without household cannot see household-only metrics.

---

## FASE 8 — SUBSCRIPTIONS + ENTITLEMENTS

Implementar según brief:

- subscriptions;
- billing customer;
- events;
- plan config;
- entitlement resolver;
- precedence;
- downgrade retention.

---

## FASE 9 — DUO COMPOSITION

Flujo completo:

```text
Find user
↓
Add to household
↓
Accept
↓
2 members
↓
Upgrade household to Duo
↓
Webhook
↓
Duo entitlements both
```

---

## FASE 10 — ONBOARDING

Integrar:

- public identity;
- find someone;
- invite;
- join;
- skip;
- progressive steps;
- first week;
- AHA.

---

## FASE 11 — LANDING

Refinar:

- hero;
- weekly system;
- find-your-person visual;
- household story;
- nutrition;
- grocery;
- Live Training;
- progress;
- pricing;
- Duo emphasis;
- FAQ;
- final CTA.

---

## FASE 12 — PAYWALLS

Integrar:

- PremiumGate;
- UpgradeModal;
- DuoGate;
- contextual paywalls;
- plan comparison.

---

## FASE 13 — REALTIME HARDENING

Implementar:

- actual connection states;
- household events;
- social events;
- selective updates;
- no duplicated effects.

---

## FASE 14 — QA

Ejecutar:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

y validación manual completa.

---

# 89. Acceptance tests de producto

## A. Discoverability

- [ ] User can search by handle.
- [ ] User can search by display name.
- [ ] User can find exact public code.
- [ ] User cannot discover `discoverable = false`.
- [ ] Search never returns private email.
- [ ] Search never returns UUID as public identifier.

## B. Profile

- [ ] Public profile shows avatar.
- [ ] Shows display name.
- [ ] Shows handle.
- [ ] Shows public code.
- [ ] Shows only permitted progress.

## C. Follow

- [ ] Can send request.
- [ ] Duplicate request rejected.
- [ ] Cannot follow self.
- [ ] Recipient can accept.
- [ ] Recipient can reject.
- [ ] Following state is persisted.
- [ ] Realtime updates the other open session.

## D. Household

- [ ] Household can be created.
- [ ] Invitation can target exact profile.
- [ ] Invitation expires.
- [ ] Invitation can be revoked.
- [ ] Invitation can be accepted only once.
- [ ] Duo cannot exceed two active members.
- [ ] Owner transfer path is defined.
- [ ] Leave path is defined.

## E. Progress

- [ ] Private data remains private.
- [ ] Shared progress uses explicit visibility.
- [ ] Household summary is available only where authorized.
- [ ] Historical data survives downgrade.

## F. Duo

- [ ] Upgrade belongs to household.
- [ ] Two members receive Duo.
- [ ] Second member is not charged separately.
- [ ] Webhook idempotency works.
- [ ] Expiration returns access according to policy.

## G. Landing

- [ ] Hero communicates training + nutrition + planning + together.
- [ ] Duo is visually emphasized.
- [ ] Pricing is config-backed.
- [ ] Monthly/yearly switch works.
- [ ] Google CTA works.
- [ ] FAQ exists.
- [ ] Mobile has no overflow.
- [ ] Reduced motion works.

---

# 90. Security acceptance criteria

- [ ] RLS is the authority.
- [ ] Frontend cannot grant itself Duo.
- [ ] localStorage cannot grant premium access.
- [ ] Public profile does not expose private fields.
- [ ] Household membership is server validated.
- [ ] Exactly-two Duo membership cannot race.
- [ ] Invite tokens are random.
- [ ] Invite tokens expire.
- [ ] Secrets are never in frontend.
- [ ] Stripe provider payloads are not exposed.
- [ ] Analytics does not contain private nutrition notes.

---

# 91. Data integrity rules

The agent must follow these rules:

### Rule 1

Never infer household membership from:

```ts
profiles.find(p => p.id !== user.id)
```

### Rule 2

Never infer partnership from:

```text
there are two profiles
```

### Rule 3

Never infer sharing because:

```text
same household
```

without checking resource visibility when the resource is private-capable.

### Rule 4

Never make an internal UUID a user-facing identity.

### Rule 5

Never let the frontend decide subscription truth.

### Rule 6

Never delete user data to enforce a downgrade.

---

# 92. Performance considerations

For People search:

- debounce around 250–350ms;
- minimum 2–3 chars for name/handle search;
- exact code search can execute immediately;
- cap results to ~10–20;
- do not query whole profiles;
- use pagination if result volume grows.

For Realtime:

- subscribe only after auth;
- unsubscribe on unmount;
- group listeners by domain;
- selectively update state.

For landing:

- no large video;
- no unoptimized GIF carousel;
- use optimized product previews.

---

# 93. UX details for mobile

## Search

Input sticky at top:

```text
[ Search name, @handle or TT-ID ]
```

Results as compact cards.

## Profile

Header:

```text
avatar
name
handle
TT-code
```

Actions stack:

```text
[Follow]
[Add to household]
```

## Household

Members become horizontal/vertical cards.

Progress summary remains readable without charts that require horizontal scrolling.

---

# 94. Error handling copy

Do not expose raw Supabase errors.

Examples:

```text
Couldn't send the request.
Try again.
```

```text
This invitation is no longer available.
```

```text
This household already has two members.
```

```text
This profile cannot be discovered.
```

```text
You no longer have access to this progress.
```

Never:

```text
PostgrestError: duplicate key value...
```

---

# 95. Empty states

### People

```text
Find someone to train with.

Search by name, @handle or Train Together ID.
```

### Household

```text
Your shared space starts with one connection.

Find someone or invite them by code.
```

### Followers

```text
No connections yet.

Start by finding someone you know.
```

---

# 96. Analytics implementation details

Events must carry only safe metadata.

Example:

```ts
track("profile_search", {
  searchMode: "handle" | "name" | "code",
})
```

Do not store the raw search text if unnecessary.

Example:

```ts
track("household_invitation_created", {
  source: "profile",
})
```

not:

```ts
track(..., {
  targetName: "Maria",
  targetEmail: "...",
  privateDetails: ...
})
```

---

# 97. Documentation updates

After implementation, update `DOCUMENTACION_TECNICA.md` with:

### New routes

```text
/app/people
/app/people/:identifier
/app/household
```

### New entities

```text
PublicProfile
profile_follows
households
household_members
household_invitations
```

### New SQL functions

- profile search
- household membership
- progress visibility

### New RLS

document table-by-table.

### New Realtime

document channels/events.

### New limitations

document anything intentionally deferred.

---

# 98. Final implementation summary the agent must print

At the end of the work, return:

```text
## Implementation summary

### Files changed
- ...

### New files
- ...

### Migrations
- ...

### Tables
- ...

### RPC/functions
- ...

### RLS
- ...

### Realtime
- ...

### Auth
- ...

### Entitlements
- ...

### Landing
- ...

### Tests
- ...

### Validation
yarn lint: PASS/FAIL
yarn typecheck: PASS/FAIL
yarn test: PASS/FAIL
yarn build: PASS/FAIL
yarn db:check: PASS/FAIL
```

Also report:

```text
### Known deferred work
- ...
```

Do not claim completion for features that are only mocked.

---

# 99. Definition of Done — expanded

The implementation is considered complete only when:

## Identity

- Google login works;
- session persists;
- production identity is Google-first;
- demo fallback remains only for local/dev if intentionally retained.

## Public profile

- every active account can have a stable public handle;
- every account can have a non-sensitive public code;
- discoverability is explicit;
- public data is intentionally restricted.

## People

- search by name;
- search by handle;
- exact public-code lookup;
- profile page;
- follow flow.

## Household

- explicit household entity;
- explicit membership;
- invitation lifecycle;
- exactly-two enforcement for Duo;
- migration compatibility with old couples.

## Shared progress

- explicit visibility;
- secure summary DTO;
- no private-data leakage;
- Realtime updates.

## Commercial layer

- Free/Plus/Duo centralized;
- entitlements centralized;
- household Duo access works;
- downgrade retention works.

## Billing

- provider abstraction;
- webhook architecture;
- event idempotency;
- no secrets;
- no fake production billing.

## Landing

- system positioning;
- social/household story;
- Duo emphasis;
- pricing;
- Google CTA;
- FAQ;
- mobile;
- accessibility;
- Spanish/English.

## Quality

- lint passes;
- typecheck passes;
- tests pass;
- build passes;
- DB checks pass;
- RLS tests pass;
- household tests pass;
- social/profile tests pass;
- subscription tests pass.

---

# 100. Guardrails for the coding agent

1. **Read the actual repository before coding.**
2. **Code is the final source of truth when documentation and code disagree.**
3. **Preserve existing behavior unless migration is required.**
4. **Do not invent APIs that do not exist.**
5. **Do not create fake Google OAuth.**
6. **Do not create fake Stripe billing and call it production-ready.**
7. **Do not expose service-role keys.**
8. **Do not implement social discovery by exposing the full `profiles` table.**
9. **Do not use UUID as public identity.**
10. **Do not treat Follow as Household.**
11. **Do not treat Household as permission to access all private data.**
12. **Do not use `profiles.length === 2` as household logic.**
13. **Do not hardcode prices in components.**
14. **Do not scatter `plan === "duo"` checks.**
15. **Do not make localStorage the subscription source of truth.**
16. **Do not delete historical data on downgrade.**
17. **Do not make basic discovery require payment unless business requirements explicitly change.**
18. **Do not fabricate testimonials or product metrics.**
19. **Do not introduce a commercial `HOUSE` plan unless it is explicitly approved and configured.**
20. **Keep business logic portable for future React Native / Expo use.**

---

# 101. Canonical end-to-end product flow

This is the most important scenario to verify manually:

```text
LANDING
  ↓
Start for free
  ↓
Continue with Google
  ↓
Create account
  ↓
Onboarding
  ↓
Create public identity
  ├─ handle
  └─ Train Together ID
  ↓
Find your person
  ├─ name
  ├─ @handle
  └─ TT-code
  ↓
Open public profile
  ↓
Follow
  OR
Add to household
  ↓
Invitation / request
  ↓
User accepts
  ↓
Household with 2 members
  ↓
Shared progress enabled according to visibility
  ↓
User builds strategy
  ↓
Plan first week
  ↓
Generate groceries
  ↓
AHA MOMENT
  ↓
Upgrade household to Duo
  ↓
Verified subscription
  ↓
Both users get Duo entitlements
  ↓
Weekly loop
  ↓
Train
  ↓
Eat
  ↓
Log
  ↓
Partner sees allowed progress
  ↓
Review
  ↓
Plan next week
```

---

# 102. Principle de producto final

Train Together debe pasar visual y técnicamente de:

```text
"I track my workouts."
```

a:

```text
"I know what I need to do this week,
I can find my person,
we can connect our accounts,
we can see the progress we're allowed to share,
and our household can coordinate the week."
```

Ese es el hilo conductor que debe unir:

```text
PROFILE
+
DISCOVERY
+
FOLLOW
+
HOUSEHOLD
+
DUO
+
TRAINING
+
NUTRITION
+
PLANNING
+
GROCERY
+
SHARED PROGRESS
```

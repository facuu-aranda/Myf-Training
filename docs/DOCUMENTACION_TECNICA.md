# Train Together — documentación técnica

> Documento de referencia del proyecto `train-together` / `MyF-Training`.
>
> **Fecha de actualización:** 2026-09-03
> **Estado:** implementación funcional con backend Supabase, catálogo nutricional ampliado, Food Log, Meal Planner, Grocery List, Insights, Social/Household, Google OAuth y modo local de demostración; validado contra el proyecto remoto el 2026-09-03.

## 1. Resumen ejecutivo

Train Together es una SPA (Single Page Application) de fitness orientada a dos usuarios que comparten progreso, actividad y motivación, pero mantienen la edición de sus datos bajo control propio. El producto separa tres conceptos de entrenamiento:

- **Estrategia:** objetivos nutricionales, actividad y planificación semanal.
- **Entrenamiento manual:** registro tradicional de series y sensaciones.
- **Live Training:** flujo guiado serie por serie con descanso automático.

La aplicación está construida como un frontend React servido por Vite. Supabase funciona como backend gestionado para PostgreSQL, autenticación, RLS (Row Level Security) y Realtime. Cuando las variables públicas de Supabase no están configuradas, la aplicación arranca con un estado demo local y persiste el estado en `localStorage`.

### Capacidades principales implementadas

- Landing pública y login con username/password y entrada Google OAuth.
- Dos perfiles demo: Fabricio y María.
- Persistencia remota en Supabase con fallback local.
- Plan nutricional y objetivos diarios editables.
- Días de entrenamiento y ejercicios planificados.
- Biblioteca de ejercicios con búsqueda, filtros y metadatos del dataset externo.
- Registro manual, registro rápido y entrenamiento guiado.
- Temporizador de descanso con pausa, salto y ajuste de tiempo.
- Comparación de carga planificada frente a carga real.
- Historial de sesiones, volumen, repeticiones, RPE y sensaciones.
- Gráficos de progreso con varios rangos temporales.
- Récords personales calculados y persistidos.
- Feed de actividad compartida y Households con invitaciones.
- Descubrimiento de personas, perfiles públicos y solicitudes de seguimiento básicas.
- Suscripción a Supabase Realtime para fitness, social y nutrición.
- Internacionalización español/inglés.
- Generación y descarga de tarjetas PNG para compartir progreso.
- Diseño responsive para escritorio y móvil.
- Catálogo nutricional de 8.753 alimentos de TACO y USDA con traducciones persistidas.
- Recipes, Food Log (food/recipe), Meal Planner, Grocery List e Insights nutricionales.

---

## 2. Estado real frente a la visión del producto

La especificación funcional original se conserva como referencia histórica en [`initial-prompt.md`](initial-prompt.md). El código actual cubre una parte importante de esa visión, pero no todas las funcionalidades descritas en ella tienen el mismo nivel de implementación.

| Área | Estado actual |
|---|---|
| Frontend y navegación | Implementado con React Router y rutas lazy-loaded. |
| Supabase/PostgreSQL | Implementado mediante migraciones versionadas, RLS, triggers, Realtime y repositorio de persistencia; validado remotamente. |
| Auth | Supabase Auth remoto con password y Google OAuth; fallback demo local con sesión en `localStorage`. Google requiere configuración del provider y URLs en Supabase/Google Cloud. |
| RLS | Implementado y validado para datos propios, household y perfiles públicos mediante helpers no recursivos. |
| Realtime | Implementado para fitness, Food Log, Meal Planner, Grocery List y tablas social/household. |
| Estrategia | Implementada para nutrición, días y ejercicios planificados. |
| Live Training | Implementado con fases `ready`, `set`, `rest` y `complete`. |
| Entrenamiento manual | Implementado. |
| Registro rápido | Implementado. |
| Progreso y analítica | Implementado con cálculos en cliente. |
| Pareja/feed | Household implementado con invitaciones, miembros y panel de nutrición compartida; Follow aún es parcial. |
| Biblioteca de ejercicios | Implementada con nueve ejercicios demo, 1.324 ejercicios remotos verificados y script de importación masiva. |
| Versionado de estrategia | La tabla existe, pero no está conectada al frontend ni al repositorio. |
| Wearables | No implementados; pasos, calorías y peso se introducen manualmente. |
| Registro público/OAuth | Google OAuth está implementado en frontend y trigger; provider, signup y redirect se configuran fuera del repositorio. |
| Recuperación/verificación de email | No implementadas, de acuerdo con el alcance original. |
| Backend custom/API propia | No existe; Supabase es el backend BaaS. |
| CI/CD y despliegue | No hay configuración de pipeline o proveedor de hosting en el repositorio. |

### Verificación remota del 2026-09-03

El proyecto remoto tiene aplicadas las migraciones de identidad social, la transición de Nutrition a `household_id`, la corrección RLS de Google y la publicación Realtime social/household.

`yarn db:check` terminó correctamente: 5 usuarios Auth, 5 perfiles, 3 households, 4 miembros activos, 8.753 alimentos traducidos, 1.324 ejercicios y todas las tablas requeridas en Realtime. La consulta anónima a `profiles` ya no devuelve recursión RLS.

---

## 3. Stack tecnológico

### Producción

| Tecnología | Uso | Referencia |
|---|---|---|
| React 19 | Componentes y renderizado de la interfaz. | `react`, `react-dom` |
| Vite 6 | Servidor de desarrollo y bundler. | `vite`, `@vitejs/plugin-react` |
| TypeScript 5.7 | Tipado estático estricto. | `typescript` |
| React Router 6 | Enrutado SPA y protección de rutas. | `react-router-dom` |
| Supabase JS 2 | Auth, consultas PostgreSQL y Realtime. | `@supabase/supabase-js` |
| PostgreSQL 15 | Base de datos local configurada para Supabase. | `supabase/config.toml` |
| Supabase Realtime | Eventos `postgres_changes` sobre tablas fitness, nutrición y social/household. | `src/lib/supabase.ts` |
| Tailwind CSS 3 | Directivas base/utilidades de CSS. | `tailwind.config.js` |
| CSS propio | Sistema visual principal y responsive design. | `src/index.css` |
| Framer Motion | Transiciones, modales, navegación y microanimaciones. | `framer-motion` |
| Recharts | Gráficos de progreso. | `recharts` |
| Lucide React | Iconografía. | `lucide-react` |
| i18next + react-i18next | Internacionalización ES/EN. | `src/i18n.ts` |

### Desarrollo y calidad

| Herramienta | Uso |
|---|---|
| Yarn 1.x | Gestor de paquetes; el repositorio contiene `yarn.lock`. |
| Vitest | Tests unitarios con entorno `jsdom`. |
| ESLint 9 | Lint de `src` y `scripts`. |
| TypeScript compiler | Typecheck y fase inicial de build. |
| Supabase CLI | Migraciones, reset, push y entorno local. |
| `tsx` | Ejecución de scripts TypeScript de seed y diagnóstico. |

No se utiliza una librería de estado externa. El estado de dominio se centraliza en `FitnessContext`.

---

## 4. Estructura del repositorio

```text
MyF-Training/
├── .env.example
├── .gitignore
├── README.md
├── vercel.json
├── docs/
│   ├── DOCUMENTACION_TECNICA.md
│   ├── TRAIN_TOGETHER_IMPLEMENTATION_PLAN_REFINED.md
│   ├── TRAIN_TOGETHER_MONETIZATION_FOUNDATION_PROMPT.md
│   ├── initial-prompt.md
│   └── new_features.md
├── package.json
├── yarn.lock
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── favicon.svg
│   └── share/.gitkeep
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── env.d.ts
│   ├── index.css
│   ├── i18n.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── database.ts
│   ├── data/
│   │   └── demo.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── FitnessContext.tsx
│   ├── hooks/
│   │   └── useFitness.ts
│   ├── lib/
│   │   ├── analytics.ts
│   │   ├── auth.ts
│   │   ├── food.ts
│   │   ├── grocery.ts
│   │   ├── household.ts
│   │   ├── live.ts
│   │   ├── nutrition.ts
│   │   ├── nutrition-analytics.ts
│   │   ├── people.ts
│   │   ├── repository.ts
│   │   ├── storage.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   └── AppShell.tsx
│   ├── components/
│   │   ├── ui/index.tsx
│   │   ├── CoupleNutritionPanel.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExerciseInfoModal.tsx
│   │   ├── ExercisePicker.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── NutritionSubnav.tsx
│   │   ├── PageMotion.tsx
│   │   ├── ShareCardModal.tsx
│   │   └── DumbbellIcon.tsx
│   └── pages/
│       ├── LandingPage.tsx
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── StrategyPage.tsx
│       ├── LiveTrainingPage.tsx
│       ├── ManualTrainingPage.tsx
│       ├── QuickLogPage.tsx
│       ├── ProgressPage.tsx
│       ├── HistoryPage.tsx
│       ├── HouseholdPage.tsx
│       ├── PeoplePage.tsx
│       ├── PublicProfilePage.tsx
│       ├── OnboardingPage.tsx
│       ├── ExerciseLibraryPage.tsx
│       ├── ProfilePage.tsx
│       ├── FoodLibraryPage.tsx
│       ├── FoodLogPage.tsx
│       ├── GroceryPage.tsx
│       ├── MealPlannerPage.tsx
│       ├── NutritionInsightsPage.tsx
│       └── RecipesPage.tsx
├── scripts/
│   ├── seed.ts
│   ├── seed-exercises.ts
│   ├── seed-foods.ts
│   ├── seed-foods-usda.ts
│   ├── seed-nutrition-demo.ts
│   └── db-check.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260828000000_initial_schema.sql
│   │   ├── 20260828010000_nutrition_foundation.sql
│   │   ├── 20260828020000_nutrition_recipes.sql
│   │   ├── 20260828030000_nutrition_food_log.sql
│   │   ├── 20260902000000_nutrition_meal_planner.sql
│   │   ├── 20260902010000_nutrition_grocery.sql
│   │   ├── 20260902020000_nutrition_food_sharing.sql
│   │   ├── 20260902030000_nutrition_search_improvements.sql
│   │   ├── 20260902040000_nutrition_restore_names.sql
│   │   ├── 20260902050000_nutrition_fix_empty_search.sql
│   │   ├── 20260902060000_social_household_foundation.sql
│   │   ├── 20260902070000_nutrition_search_prioritize_basic.sql
│   │   ├── 20260902080000_migrate_nutrition_to_households.sql
│   │   ├── 20260902090000_auth_google_trigger_fix.sql
│   │   ├── 20260902100000_household_leave_policy.sql
│   │   ├── 20260902110000_fix_auth_trigger_loop.sql
│   │   └── 20260903000000_fix_household_rls_google_login.sql
│   ├── seed/seed.sql
│   └── scripts/verify.sql
└── tests/
    ├── setup.ts
    └── fitness-logic.test.ts
```

### Responsabilidad por capa

```text
UI / Pages
    ↓ consumen
Contexts + hooks
    ↓ ejecutan acciones de dominio
lib/analytics.ts + lib/live.ts
    ↓ actualizan estado local y disparan persistencia
FitnessContext + lib/repository.ts
    ↓ consultan
Supabase Auth / PostgreSQL / Realtime
```

La aplicación no tiene un servidor Express, API REST propia ni capa de servicios HTTP adicional. Las llamadas de negocio al backend se hacen directamente desde `repository.ts` con el cliente de Supabase.

---

## 5. Arranque de la aplicación

El punto de entrada es [`src/main.tsx`](../src/main.tsx). La jerarquía de providers es:

```text
React.StrictMode
└── ErrorBoundary
    └── BrowserRouter
        └── FitnessProvider
            └── AuthProvider
                └── App
```

### `FitnessProvider`

1. Inicializa el estado desde `localStorage` o desde `demoState`.
2. Persiste el estado completo localmente cada vez que cambia.
3. Si Supabase está configurado, carga el estado remoto al montar.
4. Registra el listener de `storage` para sincronizar pestañas del mismo navegador.
5. Registra un canal de Supabase Realtime.
6. Expone todas las entidades y acciones de fitness mediante contexto.

### `AuthProvider`

1. Recupera la sesión remota con `supabase.auth.getUser()` y el perfil propio por UUID.
2. Resuelve el perfil remoto aunque todavía no haya terminado la carga global del `FitnessProvider`.
3. Reintenta brevemente la resolución cuando el trigger de alta de Auth acaba de crear el perfil.
4. Escucha `onAuthStateChange` cuando existe cliente Supabase sin marcar prematuramente al usuario como anónimo.
5. Expone `user`, `isLoading`, `signIn`, `signInWithGoogle` y `signOut`.

El cliente usa OAuth PKCE con `detectSessionInUrl: true`. El redirect de aplicación se construye desde `window.location.origin` y debe estar permitido en la configuración del proyecto Supabase.

### `App`

- Carga las páginas con `React.lazy`.
- Usa `Suspense` para mostrar `LoadingPage` mientras llega un chunk.
- Usa `ProtectedRoute` para exigir usuario autenticado bajo `/app/*`.
- Redirige rutas desconocidas a `/`.

---

## 6. Rutas de la aplicación

| Ruta | Acceso | Página | Responsabilidad |
|---|---|---|---|
| `/` | Público | `LandingPage` | Presentación del producto y entrada al login/app. |
| `/login` | Público | `LoginPage` | Autenticación por username/password y Google OAuth. |
| `/app` | Protegido | `DashboardPage` | Resumen diario, objetivos y entrenamiento del día. |
| `/app/strategy` | Protegido | `StrategyPage` | Nutrición, objetivos, días y ejercicios planificados. |
| `/app/live` | Protegido | `LiveTrainingPage` | Flujo guiado de entrenamiento. |
| `/app/manual` | Protegido | `ManualTrainingPage` | Registro serie por serie sin temporizador guiado. |
| `/app/quick-log` | Protegido | `QuickLogPage` | Registro compacto de una sesión completa. |
| `/app/progress` | Protegido | `ProgressPage` | Métricas, gráficos, adherencia y PRs. |
| `/app/history` | Protegido | `HistoryPage` | Historial y detalle de sesiones terminadas. |
| `/app/onboarding` | Protegido | `OnboardingPage` | Identidad pública y conexión inicial. |
| `/app/household` | Protegido | `HouseholdPage` | Household, miembros, invitaciones y progreso compartido. |
| `/app/people` | Protegido | `PeoplePage` | Búsqueda de perfiles públicos. |
| `/app/people/:handle` | Protegido | `PublicProfilePage` | Perfil público, Follow e invitación a household. |
| `/app/exercises` | Protegido | `ExerciseLibraryPage` | Búsqueda y consulta de ejercicios. |
| `/app/profile` | Protegido | `ProfilePage` | Perfil, metas, métricas del día, idioma y logout. |
| `/app/nutrition/foods` | Protegido | `FoodLibraryPage` | Catálogo global de alimentos. |
| `/app/nutrition/recipes` | Protegido | `RecipesPage` | Creación y edición de recetas. |
| `/app/nutrition/log` | Protegido | `FoodLogPage` | Registro diario de alimentos consumidos (Food Log). |
| `/app/nutrition/planner` | Protegido | `MealPlannerPage` | Planificador semanal de comidas. |
| `/app/nutrition/grocery` | Protegido | `GroceryPage` | Lista de compras compartida. |
| `/app/nutrition/insights` | Protegido | `NutritionInsightsPage` | Comparación consumo registrado vs. planificado. |

`AppShell` aporta sidebar de escritorio, topbar, indicador de sincronización, menú lateral móvil y navegación inferior móvil. En pantallas de hasta 820px se oculta el sidebar fijo y se utiliza navegación móvil. El topbar móvil queda sticky, se oculta al desplazarse hacia abajo y reaparece al desplazarse hacia arriba. En teléfonos, Progress apila sus métricas y adapta rangos/gráficos; Household apila invitaciones, banner y tarjetas de miembros para evitar overflow horizontal.

---

## 7. Modelo de estado frontend

El contrato principal está en [`src/types/index.ts`](../src/types/index.ts).

```ts
interface AppState {
  profiles: Profile[]
  nutritionPlans: NutritionPlan[]
  exercises: Exercise[]
  workoutDays: WorkoutDay[]
  sessions: WorkoutSession[]
  dailyMetrics: DailyMetric[]
  personalRecords: PersonalRecord[]
  activityEvents: ActivityEvent[]
}
```

### Entidades frontend

| Tipo | Propósito |
|---|---|
| `Profile` | Identidad, antropometría y objetivos diarios. |
| `NutritionPlan` | Calorías, macros, fibra, notas y fecha de inicio. |
| `Exercise` | Movimiento, traducciones, instrucciones, músculo, equipo y media. |
| `WorkoutDay` | Día planificado del usuario y sus ejercicios. |
| `WorkoutExercise` | Configuración de un ejercicio dentro de un día. |
| `WorkoutSession` | Sesión iniciada/completada/abandonada y sus series. |
| `ExerciseSet` | Resultado de una serie, incluyendo planificado vs real. |
| `DailyMetric` | Pasos, calorías, peso y notas por fecha. |
| `PersonalRecord` | Récord por peso, repeticiones, volumen, racha o pasos. |
| `ActivityEvent` | Evento visible en el feed de actividad compartida. |
| `LiveSetDraft` | Formulario temporal de la serie actual. |
| `QuickLogEntry` | Entrada compacta de registro rápido. |

Los nombres de propiedades del frontend están en camelCase. Las columnas de Supabase están en snake_case y se convierten en `repository.ts`.

### Acciones de `FitnessContext`

| Acción | Efecto local | Persistencia remota |
|---|---|---|
| `updateProfile` | Actualiza datos y `updatedAt`. | Upsert en `profiles`. |
| `updateNutrition` | Crea o actualiza el plan del usuario. | Upsert en `nutrition_plans`. |
| `addWorkoutDay` | Añade día al final del usuario. | Upsert en `workout_days`. |
| `updateWorkoutDay` | Edita nombre, idioma, descripción o día de semana. | Upsert en `workout_days`. |
| `removeWorkoutDay` | Elimina el día del estado. | Delete en `workout_days`; la FK elimina sus planes. |
| `reorderWorkoutDays` | Recalcula `orderIndex`. | Upsert de todos los días del usuario. |
| `addExerciseToDay` | Añade plan con valores iniciales. | Upsert en `workout_exercises`. |
| `updateWorkoutExercise` | Edita series, repeticiones, peso, descanso y notas. | Upsert en `workout_exercises`. |
| `removeExerciseFromDay` | Quita el plan y reindexa localmente. | Delete en `workout_exercises`. |
| `startSession` | Crea sesión activa y evento de inicio. | Upsert de sesión y evento. |
| `recordSet` | Añade serie y puede crear PR de peso/evento. | Upsert de serie, PR y evento si corresponde. |
| `removeSet` | Quita una serie del estado. | Delete en `exercise_sets`. |
| `saveQuickSession` | Crea sesión completa y todas sus series. | Upsert de sesión, series, PRs y eventos. |
| `completeSession` | Cambia sesión activa a `completed`. | Upsert de sesión y evento de finalización. |
| `abandonSession` | Cambia sesión a `abandoned`. | Upsert de sesión. |
| `updateDailyMetric` | Hace upsert por usuario y fecha. | Upsert en `daily_metrics` con conflicto `user_id,date`. |
| `refreshFromRemote` | Reemplaza todo el `AppState` con consultas remotas. | No escribe; solo lee. |

### Patrón de escritura

Las escrituras son optimistas:

```text
Interacción del usuario
    ↓
commit() modifica React state inmediatamente
    ↓
localStorage conserva AppState
    ↓
fireRemote() ejecuta persistencia Supabase sin bloquear la UI
    ↓
Realtime puede provocar refreshFromRemote() en las pestañas conectadas
```

`fireRemote` captura el error y lo envía a `console.warn`, pero no muestra una cola offline, reintento ni error de persistencia en la interfaz.

---

## 8. Autenticación y sesiones

### Modo Supabase

`src/lib/auth.ts` transforma el username a un email técnico:

```text
fabricio → fabricio@train-together.local
maria   → maria@train-together.local
```

El login se ejecuta con `supabase.auth.signInWithPassword`. El cliente Supabase se configura con:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`
- `flowType: 'pkce'`

El usuario autenticado se relaciona con `profiles` mediante el UUID de `auth.users`. Como fallback, se intenta hacer match por username derivado del email.

### Modo local/demo

Si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`:

1. Se usa `demoState` como datos iniciales.
2. El login compara el username contra las dos cuentas demo.
3. La contraseña se transforma en SHA-256 mediante Web Crypto.
4. Solo se almacena el `profileId` en `train-together-session-v1`.
5. No se hace ninguna llamada de red a Supabase.

Este modo está pensado para preview local, no como mecanismo de identidad de producción. Las contraseñas reales para crear los usuarios remotos se suministran por variables de entorno al script de seed y no deben documentarse ni versionarse.

### Registro y usuarios

- El registro público está deshabilitado en `supabase/config.toml`.
- Google OAuth está implementado en el cliente con PKCE, pero requiere habilitar el provider y configurar las URLs permitidas en Supabase/Google Cloud.
- No hay magic links ni recuperación de contraseña.
- El esquema no contiene `password_hash` en `profiles`; las credenciales remotas pertenecen a Supabase Auth.
- El trigger `handle_new_user` crea el perfil base después de insertar un usuario en `auth.users`.

### Google OAuth: configuración requerida fuera del repositorio

- Habilitar Google en Supabase Authentication → Providers.
- Configurar en Google Cloud como redirect URI el callback del proyecto Supabase: `https://awapfddioehtdhyqomkg.supabase.co/auth/v1/callback`.
- Agregar el origen local y de producción en las URLs permitidas de Supabase; la aplicación usa `${window.location.origin}/app/onboarding`.
- Mantener `enable_signup` habilitado si se desea permitir la primera entrada de cuentas Google nuevas; si solo se aceptan usuarios precreados, la cuenta Google debe existir previamente en Auth.
- No guardar client secrets en `.env` frontend ni en el repositorio.

---

## 9. Desglose funcional por pantalla

### 9.1 Landing — `LandingPage.tsx`

- Página pública con propuesta de valor.
- Selector de idioma compacto.
- CTA que dirige a `/login` o `/app` si ya existe sesión.
- Vista visual simulada del dashboard.
- Tarjetas de Live Training, analítica y progreso compartido.
- No consulta datos fitness ni Supabase directamente salvo el usuario expuesto por `AuthContext`.

### 9.2 Login — `LoginPage.tsx`

- Campos controlados de username y password.
- Validación mínima de campos obligatorios.
- Indicador de modo conectado a Supabase o demo local.
- Botones para precargar los usernames demo.
- Redirección al destino solicitado o `/app`.
- Los errores se presentan como mensaje genérico de credenciales inválidas.

### 9.3 Dashboard — `DashboardPage.tsx`

Consume perfiles, días, sesiones, métricas y eventos. Calcula:

- pasos del día frente al objetivo;
- calorías del día frente al objetivo;
- entrenamiento correspondiente al día de semana;
- entrenamientos completados esta semana;
- volumen total;
- racha actual;
- días completados de la semana;
- primeras actividades de pareja.

Presenta dos `ProgressRing`, CTA hacia Live Training/Quick Log, tarjeta del entrenamiento del día, tarjetas de métricas y actividad reciente.

### 9.4 Estrategia — `StrategyPage.tsx`

Permite al usuario autenticado:

- editar calorías y macros;
- editar fibra y notas nutricionales;
- mostrar objetivos iniciales editables aunque todavía no exista un `nutrition_plan` remoto;
- actualizar objetivo de calorías del perfil;
- crear, renombrar, eliminar y cambiar el día de un plan;
- reordenar días mediante drag and drop HTML5;
- buscar y añadir ejercicios desde `ExercisePicker`;
- editar inline series, repeticiones, peso y descanso;
- quitar ejercicios;
- abrir detalle del ejercicio.

La implementación actual permite arrastrar **días**, no arrastrar individualmente los ejercicios dentro de la lista. Los botones y formularios escriben mediante `FitnessContext`. Si el usuario nuevo aún no tiene plan nutricional ni días, se muestran objetivos iniciales y un estado vacío accionable en lugar de dejar la pantalla en blanco.

### 9.5 Live Training — `LiveTrainingPage.tsx`

El estado de la pantalla está centralizado en la propia página y sincronizado con `FitnessContext`:

```text
ready → set → rest → set → ... → complete
```

#### Inicio y recuperación

- Se selecciona un `WorkoutDay` activo.
- `startSession` evita crear más de una sesión activa por usuario.
- Si existe una sesión activa, se ofrecen reanudar o descartar.
- Al reanudar, `getNextLivePosition` busca la primera serie incompleta.

#### Serie

- Muestra ejercicio, número de ejercicio y número de serie.
- Muestra valores planificados y formulario real.
- Permite peso, repeticiones, dificultad/RPE, sensación, dolor y notas.
- Abre `ExerciseInfoModal` sin abandonar el flujo.
- `recordSet` persiste cada serie al completarla.

#### Descanso

Si `restSeconds > 0`:

- comienza una cuenta regresiva;
- permite pausar/continuar;
- permite añadir o quitar 15 segundos;
- permite saltar el descanso;
- muestra campos de peso y repeticiones mientras corre el timer;
- avanza automáticamente cuando llega a cero.

El guardado efectivo de una serie ocurre al pulsar `Complete set`, mediante `recordSet`. En la implementación actual, los valores introducidos en los campos visibles durante `RestView` no se convierten automáticamente en una serie adicional al pulsar continuar; deben registrarse desde la fase de serie.

Si `restSeconds === 0`, la implementación no entra en la fase `rest` y avanza directamente a la siguiente serie o ejercicio; no se muestra un timer falso.

#### Navegación y consistencia

`getCompletedSetsForPlan` y `getNextLivePosition` soportan ejercicios repetidos en un mismo día y asignan las series completadas al plan correspondiente. La pantalla deriva el porcentaje con `getLiveCompletionPercent`.

#### Finalización

Al completar todos los planes:

- muestra duración, volumen y repeticiones totales;
- solicita energía, fatiga, ánimo, sensación general, dificultad y notas;
- llama a `completeSession`;
- crea actividad de entrenamiento completado;
- vuelve al dashboard.

La duración se calcula en cliente a partir de `startedAt`.

### 9.6 Entrenamiento manual — `ManualTrainingPage.tsx`

- Permite elegir un día y comenzar una sesión.
- Selecciona un ejercicio planificado.
- Registra series individualmente con peso, repeticiones, dificultad, sensación, dolor y notas.
- Muestra las series guardadas.
- Permite borrar una serie.
- Finaliza la sesión y la envía al historial.
- Comparte la misma entidad `WorkoutSession` y las mismas `ExerciseSet` que Live Training.

### 9.7 Registro rápido — `QuickLogPage.tsx`

- Presenta todos los ejercicios del día como tarjetas.
- Permite indicar cuántas series se completaron por ejercicio.
- Usa un único draft de peso/repeticiones/sensaciones por ejercicio.
- Rechaza el guardado si no hay ninguna serie con repeticiones mayores que cero.
- Bloquea el uso mientras existe una sesión Live activa.
- Crea la sesión completa mediante `saveQuickSession`.
- Navega al historial después de guardar.

### 9.8 Progreso — `ProgressPage.tsx`

Calcula en cliente a partir de sesiones y métricas:

- volumen total;
- número total de entrenamientos;
- adherencia al objetivo de pasos;
- adherencia semanal de entrenamientos;
- racha;
- carga planificada (`plannedWeight × plannedReps`);
- carga real (`actualWeight × actualReps`);
- récords guardados.

Utiliza Recharts para mostrar volumen, pasos, peso corporal, entrenamientos y tendencia de RPE. Los rangos disponibles son 7, 30, 90, 180 días y `all`. En el código actual, `all` se representa por 21 días de datos demo, no por un rango ilimitado de toda la base.

### 9.9 Historial — `HistoryPage.tsx`

- Filtra sesiones del usuario que no estén activas.
- Ordena por fecha descendente.
- Muestra fecha, día, duración, volumen y estado.
- Abre detalle modal agrupado por ejercicio.
- Muestra cada serie con peso, repeticiones, RPE y presencia de notas.
- Permite compartir una tarjeta basada en el historial.

### 9.10 Household — `HouseholdPage.tsx`

- Consulta el household explícito y sus miembros.
- Muestra entrenamientos, pasos, PRs, racha y volumen semanal de los miembros visibles.
- Presenta barras comparativas sin plantearlo como competición.
- Muestra el feed de `activityEvents`.
- Gestiona invitaciones pendientes, aceptación, rechazo y salida/remoción.
- Integra el panel de nutrición compartida con opt-in.
- Permite generar una tarjeta de progreso compartido.

La visibilidad se basa en `household_members` y en las policies RLS. El runtime ya no debe inferir al otro usuario a partir del array global de perfiles.

### 9.11 People — `PeoplePage.tsx` y `PublicProfilePage.tsx`

- Busca perfiles descubiertos por nombre, handle o código `TT-*`.
- Abre un perfil público sin exponer datos privados.
- Permite enviar una solicitud de seguimiento.
- Permite invitar al usuario al household cuando existe capacidad.
- La gestión completa de aceptación/rechazo de Follow todavía no está implementada.

### 9.12 Onboarding — `OnboardingPage.tsx`

- Permite confirmar o cambiar el handle público.
- Muestra el código público estable.
- Dirige a búsqueda de personas o invitaciones de household.
- El alta automática de un household y la configuración final dependen de la migración social aplicada.

### 9.13 Biblioteca de ejercicios — `ExerciseLibraryPage.tsx`

- Busca por nombre EN/ES, target y grupo muscular.
- Filtra por grupo muscular y equipamiento.
- Muestra imágenes/GIFs cuando están disponibles.
- Abre detalle modal con instrucciones y fuente.
- Añade el ejercicio al primer día activo del usuario.

`ExercisePicker` utiliza el mismo catálogo, agrupa por músculo y se reutiliza en Estrategia.

### 9.14 Perfil — `ProfilePage.tsx`

- Edita nombre visible, altura, peso, meta de pasos y meta calórica.
- Permite registrar pasos, calorías y peso del día.
- Muestra entrenamientos completados, PRs, racha y peso.
- Cambia el idioma mediante `LanguageSwitcher`.
- Cierra sesión y navega a `/login`.

### 9.15 Biblioteca de Alimentos — `FoodLibraryPage.tsx`

- Catálogo global de alimentos base, USDA y TACO.
- Búsqueda y gestión de porciones y favoritos.

### 9.16 Recetas — `RecipesPage.tsx`

- Creación, edición y eliminación de recetas privadas o compartidas (household).
- Cálculo automático de calorías y macros por porción en base a los ingredientes.

### 9.17 Food Log — `FoodLogPage.tsx`

- Registro diario de consumo con fecha/hora, alimentos, recetas y porciones.
- Totales diarios y comparación visual con el objetivo.
- Soporte para registros privados o compartidos (household).

### 9.18 Meal Planner — `MealPlannerPage.tsx`

- Planificación semanal de comidas y recetas.
- Permite comidas flexibles (solo objetivo calórico).
- Generación de totales semanales planificados.

### 9.19 Lista de Compras — `GroceryPage.tsx`

- Lista compartida a nivel de `household`.
- Generación automática basada en `MealPlanner` y consolidación de ingredientes de recetas.
- Permite agregar artículos manuales y marcar el estado de compra.

### 9.20 Nutrition Insights — `NutritionInsightsPage.tsx`

- Comparación de consumo registrado vs. planificado.
- Métricas de adherencia diaria y semanal.

---

## 10. Analítica y reglas de negocio

La lógica está separada de los componentes en [`src/lib/analytics.ts`](../src/lib/analytics.ts) y [`src/lib/live.ts`](../src/lib/live.ts).

### Cálculos principales

| Función | Regla |
|---|---|
| `calculateVolume` | Suma `actualWeight × actualReps` por serie. |
| `calculateSessionVolume` | Aplica el cálculo anterior a una sesión. |
| `calculateCurrentStreak` | Cuenta días consecutivos con sesión completada; si hoy no tiene sesión, empieza por ayer. |
| `calculateDashboardStats` | Consolida métricas diarias, sesiones semanales, racha y volumen. |
| `calculateAdherence` | `completed / planned × 100`, limitado a 100; si no hay plan, devuelve 0. |
| `calculatePersonalRecords` | Calcula peso máximo, repeticiones máximas y mejor serie por ejercicio. |
| `getCoupleSummaries` | Consolida estadísticas por perfil activo. |
| `buildProgressData` | Genera un punto por cada día del rango seleccionado. |
| `getTodayWorkout` | Busca el día planificado para el weekday actual o el primer día activo. |
| `getNextLivePosition` | Busca el primer ejercicio/serie cuya cantidad planificada no se completó. |
| `getLiveCompletionPercent` | Calcula porcentaje de series completadas y lo limita a 100. |
| `formatTime` | Convierte segundos a `MM:SS`. |
| `getDateKey` | Convierte una fecha local a `YYYY-MM-DD`. |
| `calculateFoodLogNutrition` | Calcula una comida real desde alimentos o recetas; devuelve `null` si falta información suficiente. |
| `calculatePlannedMealNutrition` | Lee los macros persistidos de una comida planificada. |
| `buildNutritionComparison` | Construye comparación diaria entre plan y Food Log. |
| `calculateNutritionAdherence` | Calcula adherencia simétrica entre calorías planificadas y registradas. |
| `aggregateIngredients` | Agrupa ingredientes para Grocery y calcula sugerencia de compra. |
| `mergeGroceryItems` | Regenera Grocery preservando ajustes manuales y compras realizadas. |

El volumen de peso corporal o ejercicios isométricos se representa con peso/repeticiones según el modelo actual. Aunque `targetSeconds` existe en tipos y base de datos, la UI de planificación y el flujo Live se centran principalmente en repeticiones.

### Récords personales

El cliente puede crear un PR de peso al registrar una serie si supera el valor almacenado. La base de datos también tiene un trigger que actualiza el PR de peso al insertar una serie. Los PRs de repeticiones, volumen, racha y pasos se calculan o muestran en cliente según el flujo; no existe un motor SQL completo para todos los tipos.

---

## 11. Persistencia y repositorio Supabase

[`src/lib/repository.ts`](../src/lib/repository.ts) es el adaptador entre el modelo frontend y las tablas PostgreSQL.

### Lectura global

`loadRemoteState()` hace ocho consultas en paralelo:

1. `profiles`
2. `nutrition_plans`
3. `exercises`
4. `workout_days` con `workout_exercises(*)`
5. `workout_sessions` con `exercise_sets(*)`
6. `daily_metrics`
7. `personal_records`
8. `activity_events`

La lectura depende de RLS para decidir qué filas puede ver el usuario. La función no carga las tablas sociales ni las tablas de Nutrition específicas; esas se consultan mediante operaciones de dominio separadas (`household.ts`, `people.ts` y páginas nutricionales). `couples`/`couple_members` se conservan como legacy.

### Adaptación de datos

El repositorio:

- transforma snake_case a camelCase;
- convierte valores desconocidos con helpers tolerantes (`stringValue`, `numberValue`, etc.);
- adapta `instructions.en` e `instructions.es` desde JSONB a arrays;
- convierte URLs vacías a `undefined` en el frontend;
- ordena ejercicios, sesiones, métricas, PRs y eventos según la consulta.

### Escrituras

La función interna `save()` utiliza `upsert`. Las claves de conflicto principales son:

- `user_id,date` para métricas diarias;
- `user_id,exercise_id,record_type` para PRs.

Las operaciones destructivas disponibles son borrar días, planes de ejercicios y series. Las FKs de PostgreSQL completan la limpieza de planes al borrar un día y de series al borrar una sesión.

---

## 12. Base de datos PostgreSQL

La migración completa está en [`supabase/migrations/20260828000000_initial_schema.sql`](../supabase/migrations/20260828000000_initial_schema.sql).

### Relaciones principales

```text
auth.users
    │ 1:1
    ▼
profiles ────────< nutrition_plans
    │
    ├───────────< workout_days ───────< workout_exercises >──── exercises
    │                    │
    │                    └────────────< workout_sessions ───────< exercise_sets >── exercises
    │
    ├───────────< daily_metrics
    ├───────────< personal_records >──── exercises
    └───────────< activity_events

couples ───────< couple_members >──── profiles  (legacy)

households ────< household_members >──── profiles
     │
     ├──────────< household_invitations
     └──────────< recipes / meal_plans / food_logs / grocery_lists

profiles ───────< strategy_versions
```

### Tablas

#### `couples` (legacy)

| Campo | Tipo/regla | Descripción |
|---|---|---|
| `id` | `uuid`, PK | Identificador legado, también usado como `households.legacy_couple_id`. |
| `name` | `text`, requerido | Nombre del espacio; por defecto `Train Together`. |
| `created_at` | `timestamptz` | Fecha de creación UTC. |

#### `profiles`

| Campo | Tipo/regla | Descripción |
|---|---|---|
| `id` | `uuid`, PK/FK | Referencia a `auth.users(id)`, cascade al borrar. |
| `username` | `text`, unique | Debe estar en minúsculas. |
| `display_name` | `text` | Nombre visible. |
| `first_name` | `text` | Nombre corto utilizado en mensajes. |
| `public_handle` | `text`, unique | Identificador público estable para descubrimiento. |
| `public_code` | `text`, unique | Código compartible tipo `TT-XXXXXX`. |
| `discoverable` | `boolean` | Permite aparecer en búsqueda pública. |
| `profile_visibility` | `text` | Visibilidad del perfil (`discoverable`/`private`). |
| `progress_visibility` | `text` | Visibilidad del progreso (`household`/`followers`/`private`). |
| `avatar_url` | `text` nullable | URL de avatar. |
| `height_cm` | `numeric(5,1)` nullable | Altura positiva. |
| `weight_kg` | `numeric(5,1)` nullable | Peso positivo. |
| `daily_step_goal` | `integer` | Meta positiva, por defecto 10000. |
| `daily_calorie_goal` | `integer` | Meta positiva, por defecto 2000. |
| `active` | `boolean` | Perfil activo; por defecto `true`. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría básica. |

#### `couple_members` (legacy)

Tabla de unión histórica entre `couples` y `profiles`. El runtime nuevo utiliza `household_members`.

- PK compuesta: `couple_id,user_id`.
- `user_id` es `unique`, por lo que cada usuario solo puede pertenecer a un espacio.
- Las dos FKs tienen `on delete cascade`.
- El esquema permite técnicamente más de dos miembros; la regla de exactamente dos usuarios se gestiona fuera de una constraint de base de datos.

#### `households`

Unidad explícita de colaboración y futuro ownership comercial.

- `owner_user_id` identifica al propietario.
- `household_type` puede ser `duo` o `house`.
- `max_members` controla la capacidad.
- `legacy_couple_id` conserva la trazabilidad de la migración.

#### `household_members`

- Une usuarios con households.
- Tiene `role` (`owner`/`member`), `joined_at` y `left_at`.
- Las consultas de pertenencia deben usar la función segura, no una policy que vuelva a consultar la misma tabla.

#### `household_invitations` y `profile_follows`

Almacenan invitaciones de household y relaciones sociales Follow con estados explícitos. En la implementación actual el envío de Follow está disponible, pero la bandeja de aceptación/rechazo aún es parcial.

#### `nutrition_plans`

- `user_id` es FK a `profiles` y `unique`.
- Contiene `calories`, `protein`, `carbs`, `fats`, `fiber`, `notes` y `starts_on`.
- Todos los objetivos nutricionales son no negativos; las calorías deben ser positivas.

#### `foods` y fuentes nutricionales

`food_sources`, `foods`, `food_nutrients`, `food_portions`, `food_aliases` y `food_favorites` forman el catálogo global. El runtime carga datos desde Supabase, con paginación; las fuentes actuales son TACO, USDA Foundation y USDA SR Legacy, con 8.753 alimentos y nombres traducidos persistidos.

#### `recipes` y `recipe_ingredients`

Las recetas pueden ser privadas, household o system. En el esquema final usan `household_id` cuando son compartidas. Los ingredientes siempre referencian alimentos reales y conservan cantidades normalizadas.

#### `food_logs` y `food_log_items`

El Food Log conserva fecha, hora, tipo de comida, cantidad, unidad y precisión. `visibility` distingue `private` de `household`; el segundo miembro solo puede leer registros compartidos explícitamente.

#### `meal_plans`, `meal_plan_days` y `planned_meals`

El planner separa el plan del consumo real. Soporta alimentos, recetas, comidas flexibles, macros planificados y estados `planned`, `completed` y `logged`; las tablas finales usan `household_id`.

#### `grocery_lists` y `grocery_list_items`

Las listas pertenecen al household, conservan cantidades calculadas, sugerencias de compra, ajustes manuales, fuente y estado de compra. Se mantiene historial por período.

#### `exercises`

Catálogo compartido e inicialmente de solo lectura para usuarios autenticados.

- `id`: UUID interno.
- `external_id`: identificador original del dataset, unique.
- `name`, `name_es`.
- `description`.
- `instructions`: JSONB, normalmente `{ "en": string[], "es": string[] }`.
- `muscle_group`, `target`, `category`, `equipment`.
- `video_url`, `thumbnail_url`, `image_url`.
- `source`, `source_url`.
- `metadata`: JSONB para información adicional, medios o atribución.
- `created_at`, `updated_at`.

#### `workout_days`

Plan semanal del usuario.

- `user_id` es FK con cascade.
- `weekday` va de 1 a 7, con lunes como 1.
- `order_index` permite ordenar el plan.
- `active` permite desactivar un día.
- `estimated_minutes` debe ser positivo.

#### `workout_exercises`

Plan de un ejercicio dentro de un día.

- `workout_day_id` con cascade al borrar día.
- `exercise_id` con `on delete restrict`.
- `order_index`.
- `sets` positivo.
- `target_reps` no negativo.
- `target_seconds` nullable y positivo si se usa.
- `target_weight` no negativo.
- `rest_seconds` no negativo.
- `notes`.

#### `workout_sessions`

Registro de sesiones ejecutadas.

- `user_id` con cascade.
- `workout_day_id` nullable con `on delete set null` para no perder historial si se elimina el plan.
- `started_at`, `finished_at`.
- `duration_seconds` no negativo.
- `overall_feeling`, `energy`, `fatigue` y `mood`: 1–5.
- `difficulty`: 1–10.
- `status`: `active`, `completed` o `abandoned`.
- `notes`, timestamps.

#### `exercise_sets`

Resultado de cada serie.

- `session_id` con cascade.
- `exercise_id` con restrict.
- `set_number` positivo.
- `planned_weight`, `actual_weight` no negativos.
- `planned_reps`, `actual_reps` no negativos.
- `difficulty` 1–10.
- `feeling` 1–5.
- `pain_level` 0–10.
- `rest_seconds` no negativo.
- `completed_at`.
- Única por `session_id,exercise_id,set_number`.

#### `daily_metrics`

Métricas introducidas manualmente por día.

- `user_id` con cascade.
- `date`.
- `steps` y `calories` no negativos.
- `body_weight` nullable y positivo si se proporciona.
- `notes` y timestamps.
- Única por `user_id,date`.

#### `personal_records`

- `user_id` con cascade.
- `exercise_id` nullable con `on delete set null`.
- `record_type`: `weight`, `reps`, `volume`, `streak` o `steps`.
- `value` no negativo, `unit`, `achieved_at`, `label`.
- Restricción lógica declarada como unique en `user_id,exercise_id,record_type`.

#### `activity_events`

Feed generado a partir de acciones fitness.

- `user_id` con cascade.
- `event_type`: `workout_completed`, `step_goal_reached`, `personal_record`, `workout_started` o `metric_updated`.
- `title`, `description`, `entity_type`, `entity_id` nullable.
- `metadata` JSONB.
- `created_at`.

#### `strategy_versions`

Estructura preparada para versionado de estrategia:

- usuario, nombre, `starts_on`, `ends_on`;
- indicador `is_current`;
- snapshot JSONB;
- fecha de creación.

Actualmente no se consulta ni actualiza desde la aplicación.

### Índices

La migración crea índices para:

- días por usuario y orden;
- ejercicios de un día y orden;
- sesiones por usuario y fecha descendente;
- series por sesión, ejercicio y número;
- métricas por usuario y fecha descendente;
- eventos por fecha descendente;
- búsqueda full-text sobre nombre, nombre ES, músculo y equipamiento con GIN.

---

## 13. Funciones, triggers y automatismos SQL

### `set_updated_at()`

Trigger genérico que actualiza `updated_at` con la hora UTC. Está conectado a perfiles, nutrición, ejercicios, días, planes, sesiones y métricas.

### `handle_new_user()`

Trigger `after insert` sobre `auth.users`. Crea un registro base en `profiles` usando metadata de Google/email, genera `public_handle` y `public_code`, y evita colisiones de username.

### `is_couple_member(target_user_id)` (legacy)

Función `security definer` histórica para el modelo `couples`.

### Helpers de household

`is_household_member`, `is_household_owner` e `is_same_household_user` son funciones `security definer` que leen pertenencia sin volver a evaluar las policies de `household_members`. Se utilizan para evitar recursión RLS en perfiles, households e invitaciones.

### `search_public_profiles(search_query, result_limit)`

RPC segura que busca únicamente perfiles discoverable mediante handle, código público o nombre visible.

### `add_household_member(p_household_id, p_user_id, p_role)`

RPC transaccional que valida que el usuario autenticado sea el invitado, que la invitación esté vigente y que el household no supere `max_members`.

### `record_completed_workout_activity()`

Trigger `after update` de `workout_sessions`:

- detecta la transición hacia `completed`;
- calcula el volumen a partir de `exercise_sets`;
- crea un evento `workout_completed`.

### `record_step_goal_activity()`

Trigger `after insert or update` de `daily_metrics`:

- lee el objetivo de pasos del perfil;
- crea `step_goal_reached` cuando se cruza el objetivo;
- evita crear de nuevo el evento si la métrica ya estaba por encima del objetivo.

### `update_weight_record()`

Trigger `after insert` de `exercise_sets`:

- obtiene el dueño de la sesión;
- compara el peso real con el máximo anterior para ese ejercicio;
- actualiza o inserta el PR de tipo `weight`.

### `health_check()`

Devuelve un JSON con recuentos básicos y la lista de tablas Realtime esperadas. Lo utilizan `db-check.ts` y `verify.sql`.

---

## 14. Seguridad y RLS

Todas las tablas públicas tienen RLS habilitado. La intención general es:

- el usuario puede editar sus propios datos;
- puede consultar ciertos datos de la pareja;
- el catálogo de ejercicios es de lectura para usuarios autenticados;
- los eventos y métricas compartibles se filtran mediante pertenencia a la pareja.

### Matriz de acceso

| Tabla | Lectura | Escritura |
|---|---|---|
| `couples`, `couple_members` | Legacy; acceso de miembros del couple histórico. | No hay escritura normal desde el cliente. |
| `profiles` | Propio o miembro del mismo household, con helper seguro. | Solo el propio perfil. |
| `households` | Miembros activos del household. | Owner, según operación. |
| `household_members` | Propio o miembros del mismo household, sin policy recursiva. | Owner; cada usuario puede salir. |
| `household_invitations` | Invitador o invitado. | Invitaciones válidas del miembro/owner. |
| `profile_follows` | Follower o followed. | Según la relación propia. |
| `nutrition_plans` | Solo propio. | Solo propio. |
| `food_sources`, `foods`, `food_nutrients`, `food_portions`, `food_aliases` | Catálogo global autenticado. | No hay escritura desde el cliente. |
| `food_favorites` | Solo propias. | Solo propias. |
| `recipes` | Propias, household o system según visibilidad. | Solo propias. |
| `recipe_ingredients` | Según la receta visible. | Solo si la receta pertenece al usuario. |
| `food_logs` | Propios y household explícitamente compartidos. | Solo propios. |
| `food_log_items` | Según la visibilidad del Food Log padre. | Solo si el log es propio. |
| `meal_plans` | Propios y planes household visibles. | Solo propios. |
| `meal_plan_days`, `planned_meals` | Según el plan visible. | Solo si el plan pertenece al usuario. |
| `grocery_lists`, `grocery_list_items` | Miembros del household. | Miembros del household. |
| `exercises` | Cualquier usuario autenticado. | No hay policy de escritura de usuario. |
| `workout_days` | Solo propio. | Solo propio. |
| `workout_exercises` | Según pertenencia al día propio. | Solo si el día pertenece al usuario. |
| `workout_sessions`, `exercise_sets`, `daily_metrics`, `personal_records`, `activity_events` | Propio o miembro del household mediante `is_same_household_user`. | Solo propias. |
| `strategy_versions` | Solo propias. | Solo propias. |

### Credenciales y configuración

- `VITE_SUPABASE_ANON_KEY` puede llegar al navegador; la seguridad real la proporcionan Auth y RLS.
- `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse en Vite ni en el bundle frontend.
- Los scripts de seed crean usuarios con privilegios administrativos y deben ejecutarse solo en un entorno controlado.
- `.env` y `.env.*` están ignorados por Git, mientras `.env.example` sí se versiona.
- El fallback local guarda todo el `AppState` en `localStorage`; no debe considerarse almacenamiento seguro ni adecuado para datos sensibles de producción.

---

## 15. Supabase Realtime

### Tablas publicadas

Las migraciones añaden a `supabase_realtime` y configuran `replica identity full` para:

- `workout_sessions`, `exercise_sets`, `daily_metrics`, `personal_records`, `activity_events`;
- `food_logs`, `food_log_items`;
- `meal_plans`, `meal_plan_days`, `planned_meals`;
- `grocery_lists`, `grocery_list_items`;
- `households`, `household_members`, `household_invitations`, `profile_follows`.

`supabase/scripts/verify.sql` y `db-check.ts` comprueban esta configuración.

### Suscripción frontend

`subscribeToFitnessChanges()` mantiene el canal `fitness-couple-updates` para las cinco tablas de fitness. `subscribeToNutritionChanges()` usa el canal `nutrition-updates` para Food Log, Meal Planner y Grocery List. `subscribeToSocialChanges()` usa `social-household-updates` para households, miembros, invitaciones y follows; `HouseholdPage` refresca su dominio ante estos eventos.

No se implementa un merge granular por fila ni resolución de conflictos. Los cambios de perfiles, objetivos y catálogo se recargan mediante las operaciones específicas que los consumen.

El valor `isRealtimeConnected` representa principalmente que Supabase está configurado. El código actual no expone un callback detallado del estado `SUBSCRIBED`, `CHANNEL_ERROR` o `TIMED_OUT`; por ello el indicador visual no equivale a una comprobación completa de conectividad.

---

## 16. Dataset de ejercicios

La fuente declarada es [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset).

### Datos demo

`src/data/demo.ts` contiene nueve ejercicios iniciales con:

- identificador externo;
- nombre inglés y español;
- descripción e instrucciones bilingües;
- categoría, grupo muscular, target y equipamiento;
- GIF/imagen remotos;
- referencia al dataset.

La UI demo utiliza URLs raw del repositorio externo para las imágenes. Si la URL remota falla, los componentes ocultan la imagen y muestran un fallback visual.

### Importación reproducible

`scripts/seed-exercises.ts`:

1. descarga `data/exercises.json`;
2. permite cambiar la URL con `EXERCISES_DATA_URL`;
3. normaliza campos variables del dataset;
4. convierte instrucciones en arrays EN/ES;
5. resuelve rutas relativas de medios contra el root raw del repositorio;
6. conserva metadata y atribución;
7. hace upsert en bloques de 250 por `external_id`.

El script permite mantener una copia local en Supabase para que el runtime no dependa de consultar GitHub para el catálogo, aunque la demo visual sí mantiene URLs externas de media.

---

## 17. Seeds y scripts operativos

### Scripts npm/Yarn declarados

| Comando | Descripción |
|---|---|
| `yarn dev` | Ejecuta Vite en el puerto 5173. |
| `yarn build` | Ejecuta `tsc -b` y genera el bundle de producción. |
| `yarn preview` | Sirve localmente el build generado. |
| `yarn lint` | Ejecuta ESLint sobre `src` y `scripts`, sin warnings permitidos. |
| `yarn typecheck` | Ejecuta `tsc --noEmit`. |
| `yarn test` | Ejecuta Vitest una vez. |
| `yarn test:watch` | Ejecuta Vitest en modo watch. |
| `yarn seed` | Crea/actualiza usuarios, perfiles, pareja legacy, household, planes de entrenamiento, sesiones, métricas, PRs y eventos demo. |
| `yarn seed:foods` | Importa el catálogo TACO. |
| `yarn seed:foods:usda` | Importa USDA Foundation y SR Legacy. |
| `yarn seed:nutrition:demo` | Puebla recetas, planes, logs, favoritos y Grocery demo para ambos usuarios. |
| `yarn seed:demo` | Ejecuta el seed general y el seed nutricional demo. |
| `yarn seed:exercises` | Descarga y upsertea el catálogo externo. |
| `yarn db:reset` | Ejecuta `supabase db reset`. |
| `yarn db:push` | Aplica migraciones a la base configurada. |
| `yarn db:seed` | Ejecuta el mecanismo de seed de Supabase. |
| `yarn db:check` | Cuenta registros, consulta `health_check` y valida datos mínimos. |

### `scripts/seed.ts`

Usa `SUPABASE_SERVICE_ROLE_KEY` y:

- crea los dos usuarios Auth si no existen;
- obtiene sus UUID reales;
- usa UUIDs estables derivados de hashes para relacionar los datos demo;
- inserta el espacio legacy y sincroniza el household y sus miembros;
- transforma el estado demo al esquema SQL;
- upsertea sesiones, series, métricas, PRs y eventos.

Requiere contraseñas por variables de entorno:

```text
FABRICIO_PASSWORD=<valor seguro>
MARIA_PASSWORD=<valor seguro>
```

No se deben escribir esos valores en el Markdown, en el repositorio ni en el historial Git.

### `supabase/seed/seed.sql`

Es un seed SQL mínimo que:

- crea/actualiza el couple legacy conocido;
- crea perfiles para usuarios Auth con emails técnicos;
- asocia usuarios al couple legacy;
- crea planes nutricionales base.

No reemplaza a `yarn seed` para poblar todo el estado demo ni el catálogo completo.

### `scripts/db-check.ts`

Comprueba mediante service role:

- acceso a las tablas principales;
- cantidad de filas;
- ejecución de `health_check`;
- cantidad de usuarios Auth;
- presencia mínima de dos perfiles, un household activo, sus miembros y ejercicios;
- columnas finales `household_id` y campos de identidad pública;
- una consulta anónima de perfiles para detectar recursión RLS;
- publicación Realtime de las tablas de dominio.

### `supabase/config.toml`

Configuración local destacada:

- proyecto: `train-together`;
- API: puerto `54321`;
- PostgreSQL: puerto `54322`;
- Studio: puerto `54323`;
- Inbucket: puertos `54324–54326`;
- PostgreSQL major version: 15;
- signup global local habilitado para permitir alta Google; el signup por email permanece deshabilitado;
- confirmación de email deshabilitada en local;
- `site_url`: `http://localhost:5173`;
- redirect adicional: `http://127.0.0.1:5173`.

---

## 18. Configuración de entorno

La plantilla es [`.env.example`](../.env.example):

| Variable | Consumidor | Sensibilidad |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend y scripts. | Pública dentro de la aplicación, pero específica del proyecto. |
| `VITE_SUPABASE_ANON_KEY` | Frontend. | Pública por diseño; RLS debe estar correctamente configurado. |
| `SUPABASE_SERVICE_ROLE_KEY` | Todos los scripts `seed:*` y `db:check`. | Secreta; nunca exponer al navegador. |
| `SUPABASE_DB_URL` | Declarada en plantilla, no utilizada actualmente por los scripts. | Debe tratarse como secreta si se utiliza posteriormente. |
| `EXERCISES_DATA_URL` | `seed-exercises.ts`, opcional. | URL configurable, no es secreto. |
| `FABRICIO_PASSWORD` | `seed.ts`, requerida al crear Fabricio. | Secreta. |
| `MARIA_PASSWORD` | `seed.ts`, requerida al crear María. | Secreta. |
| `USDA_DATASETS` | `seed-foods-usda.ts`, opcional; permite seleccionar fuentes USDA concretas. | No es secreto. |
| `DEMO_SEED_DATE` | `seed-nutrition-demo.ts`, opcional; fija la semana del seed demo. | No es secreto. |

Para el frontend solo deben estar disponibles variables con prefijo `VITE_`. Las variables administrativas deben cargarse en la sesión de terminal que ejecuta los scripts, nunca en el bundle.

---

## 19. Instalación y ejecución local

### 19.1 Solo preview local sin Supabase

```bash
yarn install
yarn dev
```

Sin las variables públicas de Supabase, la aplicación entra en modo demo local. El estado se inicializa desde `src/data/demo.ts` y queda en `localStorage`.

### 19.2 Entorno Supabase local

Requisitos habituales: Node.js, Yarn, Supabase CLI y Docker Desktop ejecutándose.

```bash
yarn install
supabase start
supabase status
yarn db:reset
```

Después de obtener desde `supabase status` la URL y la clave anónima, se deben cargar en `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Los scripts de este repositorio cargan `.env` mediante `dotenv/config`; las variables administrativas deben existir solo en la sesión segura que ejecuta los seeds. En PowerShell, por ejemplo:

```powershell
$env:VITE_SUPABASE_URL = "<url reportada por supabase status>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
$env:FABRICIO_PASSWORD = "<password segura>"
$env:MARIA_PASSWORD = "<password segura>"
```

Después, ejecutar:

```bash
yarn seed
yarn seed:exercises
yarn seed:foods
yarn seed:foods:usda
yarn seed:nutrition:demo
yarn db:check
yarn dev
```

La URL efectiva del frontend debe coincidir con los valores de `site_url`/redirect configurados en `supabase/config.toml` o en el proyecto remoto.

### 19.3 Proyecto Supabase remoto

Flujo recomendado:

```bash
yarn install
yarn db:push
yarn seed
yarn seed:exercises
yarn seed:foods
yarn seed:foods:usda
yarn seed:nutrition:demo
yarn db:check
yarn build
yarn preview
```

Antes de `yarn seed`, `yarn seed:exercises`, `yarn seed:foods`, `yarn seed:foods:usda`, `yarn seed:nutrition:demo` y `yarn db:check`, exportar en la sesión de terminal `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Para crear las cuentas desde `yarn seed`, también se requieren `FABRICIO_PASSWORD` y `MARIA_PASSWORD`, tal como se muestra en el ejemplo de PowerShell anterior. `SUPABASE_SERVICE_ROLE_KEY` solo debe existir en la máquina o job seguro que ejecuta los scripts. El hosting del frontend solo necesita las variables `VITE_*`.

### 19.4 Despliegue Vercel

El proyecto usa Vite con salida `dist`. Vercel debe ejecutar `yarn build` y publicar `dist`. El archivo `vercel.json` configura un rewrite SPA hacia `/index.html`, necesario para que rutas como `/app/onboarding` no devuelvan 404 después del callback OAuth.

En Vercel deben estar configuradas en el entorno `Production` las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La URL de producción debe estar registrada en Supabase Auth como `Site URL`/redirect permitido; el callback de Google continúa siendo el callback del proyecto Supabase, no una ruta de Vercel.

---

## 20. Internacionalización

`src/i18n.ts` registra dos recursos:

- `en` como idioma por defecto/fallback;
- `es` como traducción española.

La preferencia se persiste en `train-together-language`. `LanguageSwitcher` cambia i18next y actualiza esa clave.

Los componentes usan claves como:

```tsx
const { t, i18n } = useTranslation()
t('dashboard.dailyProgress')
```

`localizedName()` decide entre `name` y `nameEs` para ejercicios y días.

La cobertura es amplia para navegación, formularios, estados, Live Training, métricas, pareja, perfil y landing. Permanecen algunos textos técnicos o de fallback escritos directamente en componentes, por ejemplo el mensaje de `ErrorBoundary` y ciertos labels accesibles; conviene centralizarlos si se requiere una política estricta de cero textos hardcodeados.

---

## 21. UI, diseño y responsive

### Sistema visual

`src/index.css` concentra la mayor parte del diseño:

- tema oscuro basado en `#08070d`;
- superficies tipo glassmorphism;
- gradientes violeta/magenta/cian;
- tipografías Inter, Space Grotesk y DM Mono;
- botones `neon-button`;
- tarjetas `glass-card`;
- pills de estado;
- anillos SVG de progreso;
- modales animados;
- barras de progreso y estados vacíos.

Tailwind está configurado, pero la UI se construye principalmente con clases CSS propias y componentes reutilizables.

### Componentes reutilizables

`src/components/ui/index.tsx` contiene:

- `GlassCard`
- `NeonButton`
- `IconButton`
- `ProgressRing`
- `MetricCard`
- `Avatar`
- `StatusPill`
- `SectionHeading`
- `PageHeader`
- `Field`
- `TextAreaField`
- `SelectField`
- `SearchField`
- `Modal`
- `Toast`
- `EmptyState`
- `LoadingState`
- `MiniBar`
- `Toggle`

`PageMotion` y `AnimatePresence` añaden transiciones de páginas, modales, Live Training y elementos de carga.

### Breakpoints

- `max-width: 1120px`: reduce padding, pasa grids de gráficos/pareja a una columna y reduce columnas de biblioteca.
- `max-width: 820px`: reemplaza sidebar por menú móvil y bottom navigation; adapta grids principales y Live Training.
- `max-width: 700px`: apila el layout de entrenamiento manual y días.
- `max-width: 520px`: apila formularios, ajusta tarjetas, rangos, biblioteca y botones.
- `prefers-reduced-motion`: reduce animaciones y transiciones.

---

## 22. Compartir progreso como imagen

`ShareCardModal` genera un PNG en un canvas de `1600 × 900`.

Proceso:

1. intenta cargar una imagen base en `/share/our-progress-base.png`;
2. si no existe, crea un fondo de gradiente;
3. carga hasta dos avatares con CORS;
4. dibuja tag, título, subtítulo y estadísticas;
5. permite descargar el PNG;
6. usa `navigator.share` cuando el navegador soporta compartir archivos.

`public/share/.gitkeep` deja preparado el directorio, pero no incluye actualmente una imagen base. Si se desea personalizar la tarjeta, debe añadirse el archivo con el nombre esperado y comprobarse la política CORS de las imágenes remotas.

---

## 23. Tests y verificación

La suite actual está en [`tests/fitness-logic.test.ts`](../tests/fitness-logic.test.ts), con entorno `jsdom` configurado en `vitest.config.ts`.

Cubre 18 tests unitarios relacionados con:

- volumen por series;
- límites de adherencia;
- racha incluyendo el día anterior;
- generación de puntos de progreso;
- PR de peso y repeticiones;
- siguiente posición de Live Training;
- planes con ejercicios repetidos;
- porcentaje máximo de finalización;
- formato del temporizador;
- clave de fecha local.

Todavía no existen tests de componentes, navegación E2E ni accesibilidad automatizada. La integración remota dispone de `db-check` como smoke test de esquema, columnas, una ruta anónima de RLS y publicación Realtime.

### Verificación ejecutada durante la documentación

| Comando | Resultado observado |
|---|---|
| `yarn lint` | Correcto, sin warnings. |
| `yarn typecheck` | Correcto. |
| `yarn test` | Correcto: 1 archivo y 18 tests aprobados; en Windows con límite de memoria se puede usar single fork. |
| `yarn build` | Correcto: `tsc -b` y build de Vite completados. |
| `yarn db:check` | Correcto: valida esquema final, RLS anónimo, traducciones, datos mínimos y Realtime remoto. |

El build usa lazy chunks para páginas y manual chunks para React, Motion, Charts, Supabase, iconos e i18n.

---

## 24. Limitaciones y riesgos técnicos conocidos

Esta sección describe el comportamiento actual para evitar confundir la documentación con una lista de funcionalidades futuras.

1. **Persistencia local de datos de dominio.** `FitnessProvider` guarda el `AppState` completo en `localStorage`, incluyendo perfiles, sesiones y métricas. Es útil como fallback demo, pero no ofrece cifrado ni control de acceso real.
2. **Hash local no equivalente a Auth de producción.** El fallback usa SHA-256 en el cliente sin salt ni política de credenciales. Solo debe usarse para demostración.
3. **Persistencia remota fire-and-forget.** La UI confirma el cambio antes de conocer el resultado de Supabase. Los errores solo se registran en consola y no existe outbox/retry/conflict resolution.
4. **Indicador Realtime simplificado.** `isRealtimeConnected` se basa principalmente en la presencia de configuración, no en el estado real del canal.
5. **Refresh completo ante cada evento.** Un cambio en una tabla Realtime vuelve a consultar todo el estado, lo que es simple pero puede ser costoso con más datos.
6. **Cobertura parcial de Realtime.** Fitness y Nutrition tienen canales; las tablas social/household tienen canal frontend y quedan publicadas por la migración correctiva, pero todavía no existe una máquina de estados detallada de reconexión.
7. **Eventos potencialmente duplicados.** `completeSession` crea un evento desde el frontend y la migración también tiene un trigger que crea `workout_completed` al pasar la sesión a `completed`. En modo remoto deben revisarse los duplicados.
8. **PR de peso duplicado en responsabilidad.** El frontend calcula un PR al registrar una serie y PostgreSQL también lo calcula con un trigger. La constraint/upsert reduce duplicados de fila, pero la lógica debería tener una única fuente de verdad.
9. **Versionado no conectado.** `strategy_versions` existe en SQL y en `database.ts`, pero no se carga ni se utiliza en la interfaz.
10. **Migración social en dos etapas.** El esquema conserva `couples`/`couple_members` como legacy y el runtime usa `households`/`household_members`; el remoto debe tener aplicada la migración de Nutrition a `household_id`.
11. **Capacidad DUO.** `max_members` y el RPC controlan la capacidad de incorporación, pero no existe todavía una capa comercial de entitlements que bloquee capacidades premium.
12. **Reordenamiento limitado.** El drag and drop nativo se implementa para días; no hay drag and drop de ejercicios dentro de la rutina ni librería especializada para soporte táctil completo.
13. **Rangos analíticos.** El rango `all` de progreso está limitado a 21 días en el código actual.
14. **Localización residual.** Existen algunos textos directos en inglés o labels accesibles no incluidos en los recursos de i18n.
15. **Media externa.** Las imágenes/GIF demo usan GitHub raw/Unsplash en runtime; una caída externa afecta la presentación aunque el catálogo esté en Supabase.
16. **Métricas manuales.** No hay integración con relojes, wearables, calorías automáticas ni fuentes de actividad externas.
17. **Recalculo de récords.** Al borrar una serie no hay un proceso general que recalcule todos los PRs derivados.
18. **Tipos Supabase no generados.** `src/types/database.ts` es un contrato manual y el cliente exportado en `src/lib/supabase.ts` no está parametrizado con `Database`, por lo que parte de la seguridad de tipos se pierde en las consultas.
19. **Seed SQL parcial.** `supabase/seed/seed.sql` depende de que existan usuarios Auth y cubre un subconjunto del estado; el seed completo está en `scripts/seed.ts`.
20. **Sin despliegue declarado.** No hay configuración de hosting, variables de producción, migración automatizada de secretos, CI ni estrategia de rollback en el repositorio.
21. **Monetización no implementada.** No existen `subscriptions`, `entitlements`, `billing_customers`, checkout, webhooks, portal de billing ni gates comerciales.
22. **Google depende de configuración externa.** El cliente usa PKCE y el trigger genera el perfil, pero Supabase Provider, Google Cloud callback, URLs permitidas y la política de signup deben configurarse fuera del repositorio.

---

## 25. Recomendaciones de evolución

### Prioridad alta

1. Elegir una única fuente de verdad para eventos de finalización y PRs, evitando que frontend y triggers creen el mismo dato.
2. Añadir tests SQL para RLS, triggers, función `is_couple_member` y publicación Realtime.
3. Generar tipos oficiales con Supabase y utilizar `SupabaseClient<Database>`.
4. Sustituir la persistencia fire-and-forget por operaciones con estado de error, reintento y cola offline si se requiere robustez.
5. Desactivar el modo demo/local en builds de producción o marcarlo explícitamente como no seguro.
6. Mantener la migración final a `household_id` y las helpers RLS cubiertas por smoke tests remotos.
7. Añadir una prueba E2E de Google OAuth y validación del callback PKCE en cada deployment.
8. Diseñar la capa de subscriptions/entitlements antes de incorporar pagos reales.

### Prioridad media

1. Conectar `strategy_versions` y guardar snapshots antes de cambios importantes.
2. Implementar reordenamiento de ejercicios con una solución táctil y persistencia transaccional.
3. Añadir paginación o límites para sesiones, eventos y métricas.
4. Suscribirse a cambios de estrategia relevantes o refrescar explícitamente tras editarla.
5. Añadir estados Realtime reales (`SUBSCRIBED`, error, reconexión) y mostrar feedback al usuario.
6. Completar la internacionalización de fallbacks y labels.
7. Implementar recalculo de PRs después de borrar o corregir series.

### Prioridad de calidad

1. Tests de páginas y componentes críticos.
2. Tests E2E de login, Live Training, recuperación de sesión activa y flujo de pareja.
3. Auditoría de accesibilidad de modales, navegación por teclado, foco y formularios.
4. Sustituir dependencias de media externa por almacenamiento estable o CDN controlado.
5. Añadir documentación de despliegue y pipeline de migraciones.

---

## 26. Archivos de referencia rápida

| Necesidad | Archivo |
|---|---|
| Rutas y protección | [`src/App.tsx`](../src/App.tsx) |
| Bootstrap de React | [`src/main.tsx`](../src/main.tsx) |
| Estado fitness | [`src/contexts/FitnessContext.tsx`](../src/contexts/FitnessContext.tsx) |
| Estado auth | [`src/contexts/AuthContext.tsx`](../src/contexts/AuthContext.tsx) |
| Cliente Supabase/Realtime | [`src/lib/supabase.ts`](../src/lib/supabase.ts) |
| Adaptador de persistencia | [`src/lib/repository.ts`](../src/lib/repository.ts) |
| Login | [`src/lib/auth.ts`](../src/lib/auth.ts) |
| Analítica | [`src/lib/analytics.ts`](../src/lib/analytics.ts) |
| Nutrición y cálculo | [`src/lib/nutrition.ts`](../src/lib/nutrition.ts) |
| Agregación Grocery | [`src/lib/grocery.ts`](../src/lib/grocery.ts) |
| Insights nutricionales | [`src/lib/nutrition-analytics.ts`](../src/lib/nutrition-analytics.ts) |
| Household/social | [`src/lib/household.ts`](../src/lib/household.ts), [`src/lib/people.ts`](../src/lib/people.ts) |
| Lógica de Live Training | [`src/lib/live.ts`](../src/lib/live.ts) |
| Tipos de dominio | [`src/types/index.ts`](../src/types/index.ts) |
| Tipos de base de datos | [`src/types/database.ts`](../src/types/database.ts) |
| Estado demo | [`src/data/demo.ts`](../src/data/demo.ts) |
| Traducciones | [`src/i18n.ts`](../src/i18n.ts) |
| Sistema visual | [`src/index.css`](../src/index.css) |
| Componentes UI | [`src/components/ui/index.tsx`](../src/components/ui/index.tsx) |
| Esquema, funciones, RLS y Realtime | [`supabase/migrations/`](../supabase/migrations/) |
| Seed completo | [`scripts/seed.ts`](../scripts/seed.ts), [`scripts/seed-nutrition-demo.ts`](../scripts/seed-nutrition-demo.ts) |
| Importación de ejercicios | [`scripts/seed-exercises.ts`](../scripts/seed-exercises.ts) |
| Importación de alimentos | [`scripts/seed-foods.ts`](../scripts/seed-foods.ts), [`scripts/seed-foods-usda.ts`](../scripts/seed-foods-usda.ts) |
| Diagnóstico de DB | [`scripts/db-check.ts`](../scripts/db-check.ts) |
| Tests | [`tests/fitness-logic.test.ts`](../tests/fitness-logic.test.ts) |
| Variables de entorno | [`.env.example`](../.env.example) |

---

## 27. Nutrition, Social y Household — estado implementado

El subsistema nutricional y la capa inicial social/household se agregaron sin mezclar su estado específico con `FitnessContext`. Esta sección describe el estado validado del código y del esquema remoto al 2026-09-03.

### Componentes incorporados

- Migraciones versionadas de Nutrition y social: foundation, recipes, Food Log, Meal Planner, Grocery, sharing, mejoras de búsqueda, `social_household_foundation`, migración final a `household_id`, fixes de trigger Google/username, policy de salida y corrección RLS en `supabase/migrations/`; las migraciones críticas `20260902080000_migrate_nutrition_to_households.sql` y `20260903000000_fix_household_rls_google_login.sql` ya están aplicadas y validadas en el remoto.
- Tablas `food_sources`, `foods`, `food_nutrients`, `food_portions`, `food_aliases`, `food_favorites`, `recipes`, `recipe_ingredients`, `food_logs`, `food_log_items`, `meal_plans`, `meal_plan_days`, `planned_meals`, `grocery_lists`, `grocery_list_items`, `households`, `household_members`, `household_invitations` y `profile_follows`.
- RLS para catálogo global de lectura autenticada y favoritos privados por usuario.
- Índices de búsqueda, fuente, porciones y favoritos.
- Tipos de dominio en `src/types/index.ts` y contrato manual en `src/types/database.ts`.
- Cálculos puros en `src/lib/nutrition.ts` para cantidades, porciones, comidas y recetas.
- Repositorio para carga, búsqueda y favoritos en `src/lib/repository.ts`.
- Hook `src/hooks/useFoodLibrary.ts` y pantalla `/app/nutrition/foods`.
- Editor de recetas en `/app/nutrition/recipes`, con ingredientes reales y cálculo por porción.
- Food Log en `/app/nutrition/log`, con fecha/hora, múltiples alimentos y totales diarios.
- Meal Planner semanal en `/app/nutrition/planner`, con comidas por día, comidas flexibles y macros planificados.
- Grocery List household en `/app/nutrition/grocery`, con generación por horizonte, artículos manuales y estado de compra.
- Nutrition Insights en `/app/nutrition/insights`, con comparación planificado vs. registrado y adherencia diaria/semanal.
- People/Household en `/app/people` y `/app/household`, con identidad pública e invitaciones.
- Panel de nutrición compartida dentro de `/app/household`, con visibilidad explícita.
- Importers reproducibles `scripts/seed-foods.ts` y `scripts/seed-foods-usda.ts`, con comandos `yarn seed:foods` y `yarn seed:foods:usda`.
- Seed demo nutricional `scripts/seed-nutrition-demo.ts`, ejecutable con `yarn seed:nutrition:demo` o `yarn seed:demo`.

### Fuente inicial

Se inspeccionó la estructura real de `brolesi/taco`. La composición procesada contiene 597 alimentos en CSV y sus valores están expresados por 100 g de parte comestible. El importer conserva los campos principales, micronutrientes disponibles y la trazabilidad de la fuente. Cada alimento recibe inicialmente una porción explícita de 100 g.

Las medidas POF se mantienen separadas porque sus códigos de alimento no tienen una equivalencia automática segura con los IDs TACO. No se realiza matching difuso ni se inventan equivalencias; las medidas caseras se incorporarán mediante un mapeo validado.

El repositorio TACO declara licencia MIT para código y repositorio, pero indica que los datos pertenecen a sus fuentes primarias. La aplicación guarda `source`, `source_url`, `license`, `attribution` e `imported_at` para conservar trazabilidad.

El campo `name` conserva el nombre original en portugués; `name_es` y `name_en` se completan durante la importación y quedan persistidos en Supabase. Las categorías y preparaciones localizadas se guardan en `metadata`. No se consulta ningún servicio de traducción durante el runtime; si una traducción requiere corrección editorial, se actualiza en el importer o mediante un catálogo curado.

Se incorporaron además USDA Foundation Foods (363 registros utilizables; 32 entradas `null` del archivo oficial) y SR Legacy (7.793 registros). El comando `yarn seed:foods:usda` los importa por fuente independiente, usa el nombre inglés original, genera el nombre español durante el seed e importa las porciones disponibles. El dump USDA Branded no se importa masivamente por su volumen y porque está orientado a productos comerciales.

### Ejecución

Después de aplicar la migración en Supabase SQL Editor o mediante `supabase db push`:

```bash
yarn seed:foods
yarn db:check
```

El runtime consulta Supabase; no consulta GitHub para cada búsqueda. La biblioteca utiliza consultas acotadas y el repositorio pagina los catálogos grandes.

El seed nutricional demo usa IDs deterministas y solo upsertea sus propias filas. En el entorno remoto validado dejó 3 recetas, 2 planes semanales, 56 comidas planificadas, 40 Food Logs, 20 favoritos y 8 artículos de Grocery para los dos usuarios demo.

### Recipes (Phase 3)

La migración `20260828020000_nutrition_recipes.sql` agrega `recipes` y `recipe_ingredients`. En el esquema final, las recetas pueden ser privadas o compartidas mediante `household_id`; los ingredientes siempre referencian alimentos reales y las calorías/macros se calculan desde sus nutrientes y servings.

La pantalla `/app/nutrition/recipes` permite crear, editar y eliminar recetas, buscar alimentos para agregar ingredientes y previsualizar la nutrición por porción. La migración debe aplicarse después de `20260828010000_nutrition_foundation.sql`.

### Food Log (Phase 4 foundation)

La migración `20260828030000_nutrition_food_log.sql` agrega `food_logs` y `food_log_items`. La ejecución conserva fecha y hora real, tipo de comida, cantidades, unidad, porción, precisión (`exact`, `estimated` o `portion`) y una referencia a alimento o receta. Los registros son privados por usuario y están preparados para Realtime.

La pantalla `/app/nutrition/log` permite cambiar el día, registrar múltiples alimentos o recetas por comida, calcular el total diario contra el objetivo existente, elegir visibilidad `private`/`household` y eliminar registros propios. Para recetas, la cantidad se interpreta como porciones y se recalcula desde sus ingredientes. Los registros existentes permanecen privados por defecto.

La migración `20260902020000_nutrition_food_sharing.sql` agrega el opt-in de household y actualiza las políticas RLS: solo los registros marcados explícitamente como `household` pueden ser leídos por el otro miembro de la pareja.

### Meal Planner (Phase 5 foundation)

La migración `20260902000000_nutrition_meal_planner.sql` agrega `meal_plans`, `meal_plan_days` y `planned_meals`, diferenciando lo planificado de lo registrado. Incluye comidas flexibles con calorías objetivo, estados `planned`/`completed`/`logged`, RLS del usuario/household y Realtime.

La pantalla `/app/nutrition/planner` permite navegar por semanas, agregar alimentos, recetas o comidas flexibles a cada día, definir horario, tipo de comida y cantidad, editar, duplicar, mover o eliminar comidas, y ver el total semanal planificado. La comparación contra Food Log se visualiza en `/app/nutrition/insights`.

### Grocery List (Phase 6 foundation)

La migración `20260902010000_nutrition_grocery.sql` agrega `grocery_lists` y `grocery_list_items`. En el esquema final, las listas pertenecen al household mediante `household_id`, incluyen cantidades calculadas, sugerencia de compra, ajustes manuales, fuente (`planned`, `recipe-derived` o `manual`) y estado `pending`/`purchased`.

La pantalla `/app/nutrition/grocery` permite generar listas para 7, 14 o 28 días, sumar alimentos planificados e ingredientes de recetas, redondear cantidades de compra, agrupar por categorías, agregar artículos del hogar, modificar cantidades, marcar compras, consultar historial y regenerar sin borrar artículos manuales.

### Couple Nutrition (Phase 7 foundation)

El componente `src/components/CoupleNutritionPanel.tsx` agrega un resumen semanal por perfil dentro de `/app/household`. Para el usuario autenticado utiliza sus registros propios; para el otro perfil solo consulta logs con visibilidad `household`. Los planes privados y los consumos privados no se exponen.

### Limitaciones actuales

- La generación usa los planes propios y los planes household explícitamente compartidos; el resumen de pareja no transforma datos privados en datos compartidos automáticamente.

- El catálogo inicial usa la composición TACO y porciones de 100 g; las equivalencias POF requieren mapeo explícito.
- El detalle muestra los datos nutricionales disponibles; los valores ausentes de la fuente se conservan como `null` y no se interpretan como cero.
- Open Food Facts, LATINFOODS y ARGENFOODS quedan como providers futuros sujetos a revisión de licencia; USDA Foundation y SR Legacy ya están importados.

---

## 28. Evolución hacia SaaS y Households (Fase Comercial)

La aplicación ha migrado su estructura social inicial (`couples`) hacia un modelo de hogares compartidos (`households`).

### 28.1 Descubrimiento de Personas
- Los usuarios ahora cuentan con dos identificadores públicos en su perfil: `public_handle` (e.g. `@fabricio`) y `public_code` (e.g. `TT-7K4M9P`).
- La nueva página `/app/people` (`PeoplePage.tsx`) permite buscar usuarios, visualizar sus perfiles públicos, solicitar seguirlos o invitarlos al household.

### 28.2 Households e Invitaciones
- Se implementó la tabla `households` (migrada desde `couples`), con manejo estructurado de miembros (`household_members`) y capacidad explícita mediante `max_members`; el household demo actual es tipo Duo de dos personas.
- Se implementó el sistema de `household_invitations` que incluye estados como `pending`, `accepted` y `declined`.
- La ruta legacy de pareja fue reemplazada por `HouseholdPage`, soportando múltiples usuarios y un panel superior de administración de invitaciones; `CouplePage.tsx` ya no forma parte del árbol enroutado.
- Todas las tablas del sistema de nutrición (`food_logs`, `grocery_lists`, `meal_plans`, `recipes`) se actualizaron para utilizar `household_id` en lugar de `couple_id`. Sus políticas de seguridad (RLS) validan el acceso mediante helpers seguros sobre `household_members`, sin recursión.

### 28.3 Monetización y pasarela de pago

La pasarela de pago todavía no está implementada, y tampoco existe aún la foundation comercial completa. No hay tablas `subscriptions`, `entitlements`, `billing_customers` o `subscription_events`, ni checkout, webhooks, portal de billing o gates server-side. Los tiers y precios de los documentos de planificación son hipótesis de producto, no capacidades activas del sistema.

### 28.4 Matriz contra las planificaciones SaaS

| Área | Estado real al 2026-09-03 | Evaluación |
|---|---|---|
| Training existente | Login password, dashboard, Strategy, Live, Manual, Quick Log, Progress e History | Implementado; conserva deuda de persistencia optimista y tests E2E. |
| Nutrition | Food Library, 8.753 alimentos, Recipes, Food Log, Planner, Grocery e Insights | Implementado en código y validado en el remoto con `household_id`. |
| Identidad pública | Handle, código TT, búsqueda y perfil público | Parcial; faltan relationship states y gestión completa de Follow. |
| Household | Tablas, invitaciones, aceptación/rechazo y UI | Implementado y validado; no hay invitaciones ni follows pendientes en los datos actuales. |
| Shared Progress | Panel de household y nutrición household opt-in | Parcial; no existe todavía selección granular completa por indicador ni enforcement de `progress_visibility` para followers. |
| Google OAuth | Botón, PKCE, callback de sesión y trigger de perfil | Código corregido; requiere provider, signup y URLs configurados en Supabase/Google Cloud. |
| Realtime | Fitness, Nutrition y canal Social/Household | Implementado y publicado; falta estado detallado de conexión y refresh selectivo. |
| FREE/PLUS/DUO | Copy/precios iniciales en Landing | No implementado como autorización; faltan configuración central, entitlements y gates. |
| Pasarela de pago | Ninguna | Pendiente explícito; no hay checkout, webhook ni portal. |
| Tests | 18 tests unitarios de dominio y smoke `db:check` | Parcial; faltan RLS, OAuth, Realtime, E2E, componentes y accesibilidad. |

### 28.5 Hallazgos de razonamiento y decisiones corregidas

- Se mezclaron durante una etapa `couples/couple_members` y `households/household_members`; el esquema canónico futuro debe ser household y las tablas couple deben quedar solo como legacy.
- `db:check` inicialmente usaba service role y no detectaba ni recursión RLS ni columnas ausentes; ahora valida columnas finales, ruta anónima de perfiles y publicación Realtime.
- Google OAuth no es únicamente un botón: necesita que el cliente procese el callback (`detectSessionInUrl`/PKCE), que el trigger cree el perfil y que el provider permita signup/redirects.
- Seguir, compartir progreso y pertenecer a un household son permisos diferentes; Follow todavía requiere su bandeja y estados completos.
- La pasarela no debe empezar por componentes de pago: primero hacen falta `PlanCode`, `subscriptions`, `entitlements`, source of truth server-side, idempotencia y límites configurables.

---

## 29. Conclusión

El proyecto ya constituye una aplicación funcional de entrenamiento para dos personas, no únicamente un mockup visual: tiene navegación protegida, estado de dominio, persistencia Supabase, migración PostgreSQL, RLS, triggers, Realtime, seeds, analítica, tests y build de producción.

La arquitectura es apropiada para una aplicación pequeña y privada: React mantiene la experiencia interactiva, `FitnessContext` centraliza las mutaciones y Supabase proporciona autenticación, base de datos y sincronización. Para escalar hacia un uso de producción más exigente, las áreas críticas son la consistencia entre triggers y lógica de cliente, el control de errores de persistencia, el uso de tipos Supabase generados, la validación explícita de la relación de pareja y la cobertura de pruebas de seguridad/integración.

# Train Together — documentación técnica

> Documento de referencia del proyecto `train-together` / `MyF-Training`.
>
> **Fecha de análisis:** 2026-08-28  
> **Estado:** implementación funcional con modo local de demostración y backend opcional en Supabase.

## 1. Resumen ejecutivo

Train Together es una SPA (Single Page Application) de fitness orientada a dos usuarios que comparten progreso, actividad y motivación, pero mantienen la edición de sus datos bajo control propio. El producto separa tres conceptos de entrenamiento:

- **Estrategia:** objetivos nutricionales, actividad y planificación semanal.
- **Entrenamiento manual:** registro tradicional de series y sensaciones.
- **Live Training:** flujo guiado serie por serie con descanso automático.

La aplicación está construida como un frontend React servido por Vite. Supabase funciona como backend gestionado para PostgreSQL, autenticación, RLS (Row Level Security) y Realtime. Cuando las variables públicas de Supabase no están configuradas, la aplicación arranca con un estado demo local y persiste el estado en `localStorage`.

### Capacidades principales implementadas

- Landing pública y login con username/password.
- Dos perfiles demo: Facundo y María.
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
- Feed de actividad compartida entre los dos perfiles.
- Suscripción a Supabase Realtime.
- Internacionalización español/inglés.
- Generación y descarga de tarjetas PNG para compartir progreso.
- Diseño responsive para escritorio y móvil.

---

## 2. Estado real frente a la visión del producto

La especificación funcional original está en [`initial-prompt.md`](initial-prompt.md). El código actual cubre una parte importante de esa visión, pero no todas las funcionalidades descritas en ella tienen el mismo nivel de implementación.

| Área | Estado actual |
|---|---|
| Frontend y navegación | Implementado con React Router y rutas lazy-loaded. |
| Supabase/PostgreSQL | Implementado mediante una migración inicial y repositorio de persistencia. |
| Auth | Supabase Auth en modo remoto; fallback demo local con sesión en `localStorage`. |
| RLS | Implementado para separar datos propios y datos visibles para la pareja. |
| Realtime | Implementado para sesiones, series, métricas, PRs y eventos. |
| Estrategia | Implementada para nutrición, días y ejercicios planificados. |
| Live Training | Implementado con fases `ready`, `set`, `rest` y `complete`. |
| Entrenamiento manual | Implementado. |
| Registro rápido | Implementado. |
| Progreso y analítica | Implementado con cálculos en cliente. |
| Pareja/feed | Implementado, con datos compartidos definidos por RLS. |
| Biblioteca de ejercicios | Implementada con nueve ejercicios demo y script de importación masiva. |
| Versionado de estrategia | La tabla existe, pero no está conectada al frontend ni al repositorio. |
| Wearables | No implementados; pasos, calorías y peso se introducen manualmente. |
| Registro público/OAuth | No implementados intencionadamente. |
| Recuperación/verificación de email | No implementadas, de acuerdo con el alcance original. |
| Backend custom/API propia | No existe; Supabase es el backend BaaS. |
| CI/CD y despliegue | No hay configuración de pipeline o proveedor de hosting en el repositorio. |

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
| Supabase Realtime | Eventos `postgres_changes` sobre tablas fitness. | `src/lib/supabase.ts` |
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
├── DOCUMENTACION_TECNICA.md
├── initial-prompt.md
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
│   │   ├── live.ts
│   │   ├── repository.ts
│   │   ├── storage.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── layouts/
│   │   └── AppShell.tsx
│   ├── components/
│   │   ├── ui/index.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExerciseInfoModal.tsx
│   │   ├── ExercisePicker.tsx
│   │   ├── LanguageSwitcher.tsx
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
│       ├── CouplePage.tsx
│       ├── ExerciseLibraryPage.tsx
│       └── ProfilePage.tsx
├── scripts/
│   ├── seed.ts
│   ├── seed-exercises.ts
│   └── db-check.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/20260828000000_initial_schema.sql
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

El punto de entrada es [`src/main.tsx`](src/main.tsx). La jerarquía de providers es:

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

1. Espera a que estén disponibles los perfiles del `FitnessProvider`.
2. Intenta recuperar la sesión remota con `supabase.auth.getUser()`.
3. En modo local, busca el identificador de sesión en `localStorage`.
4. Escucha `onAuthStateChange` cuando existe cliente Supabase.
5. Expone `user`, `isLoading`, `signIn` y `signOut`.

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
| `/login` | Público | `LoginPage` | Autenticación por username/password. |
| `/app` | Protegido | `DashboardPage` | Resumen diario, objetivos y entrenamiento del día. |
| `/app/strategy` | Protegido | `StrategyPage` | Nutrición, objetivos, días y ejercicios planificados. |
| `/app/live` | Protegido | `LiveTrainingPage` | Flujo guiado de entrenamiento. |
| `/app/manual` | Protegido | `ManualTrainingPage` | Registro serie por serie sin temporizador guiado. |
| `/app/quick-log` | Protegido | `QuickLogPage` | Registro compacto de una sesión completa. |
| `/app/progress` | Protegido | `ProgressPage` | Métricas, gráficos, adherencia y PRs. |
| `/app/history` | Protegido | `HistoryPage` | Historial y detalle de sesiones terminadas. |
| `/app/couple` | Protegido | `CouplePage` | Resumen de ambos perfiles y feed compartido. |
| `/app/exercises` | Protegido | `ExerciseLibraryPage` | Búsqueda y consulta de ejercicios. |
| `/app/profile` | Protegido | `ProfilePage` | Perfil, metas, métricas del día, idioma y logout. |

`AppShell` aporta sidebar de escritorio, topbar, indicador de sincronización, menú lateral móvil y navegación inferior móvil. En pantallas de hasta 820px se oculta el sidebar fijo y se utiliza navegación móvil.

---

## 7. Modelo de estado frontend

El contrato principal está en [`src/types/index.ts`](src/types/index.ts).

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
facundo → facundo@train-together.local
maria   → maria@train-together.local
```

El login se ejecuta con `supabase.auth.signInWithPassword`. El cliente Supabase se configura con:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: false`

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
- No hay OAuth, magic links ni recuperación de contraseña.
- El esquema no contiene `password_hash` en `profiles`; las credenciales remotas pertenecen a Supabase Auth.
- El trigger `handle_new_user` crea el perfil base después de insertar un usuario en `auth.users`.

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
- actualizar objetivo de calorías del perfil;
- crear, renombrar, eliminar y cambiar el día de un plan;
- reordenar días mediante drag and drop HTML5;
- buscar y añadir ejercicios desde `ExercisePicker`;
- editar inline series, repeticiones, peso y descanso;
- quitar ejercicios;
- abrir detalle del ejercicio.

La implementación actual permite arrastrar **días**, no arrastrar individualmente los ejercicios dentro de la lista. Los botones y formularios escriben mediante `FitnessContext`.

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

### 9.10 Pareja — `CouplePage.tsx`

- Calcula un `CoupleSummary` por cada perfil activo.
- Muestra entrenamientos, pasos, PRs, racha y volumen semanal.
- Presenta barras comparativas sin plantearlo como competición.
- Muestra el feed de `activityEvents`.
- Indica modo local o sincronización activa.
- Permite generar una tarjeta de progreso compartido.

La visibilidad del otro usuario está soportada por RLS y por la función `is_couple_member`. La UI, sin embargo, obtiene el conjunto de perfiles y no consulta explícitamente `couples` o `couple_members`; asume que el perfil distinto al usuario actual es la pareja.

### 9.11 Biblioteca de ejercicios — `ExerciseLibraryPage.tsx`

- Busca por nombre EN/ES, target y grupo muscular.
- Filtra por grupo muscular y equipamiento.
- Muestra imágenes/GIFs cuando están disponibles.
- Abre detalle modal con instrucciones y fuente.
- Añade el ejercicio al primer día activo del usuario.

`ExercisePicker` utiliza el mismo catálogo, agrupa por músculo y se reutiliza en Estrategia.

### 9.12 Perfil — `ProfilePage.tsx`

- Edita nombre visible, altura, peso, meta de pasos y meta calórica.
- Permite registrar pasos, calorías y peso del día.
- Muestra entrenamientos completados, PRs, racha y peso.
- Cambia el idioma mediante `LanguageSwitcher`.
- Cierra sesión y navega a `/login`.

---

## 10. Analítica y reglas de negocio

La lógica está separada de los componentes en [`src/lib/analytics.ts`](src/lib/analytics.ts) y [`src/lib/live.ts`](src/lib/live.ts).

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

El volumen de peso corporal o ejercicios isométricos se representa con peso/repeticiones según el modelo actual. Aunque `targetSeconds` existe en tipos y base de datos, la UI de planificación y el flujo Live se centran principalmente en repeticiones.

### Récords personales

El cliente puede crear un PR de peso al registrar una serie si supera el valor almacenado. La base de datos también tiene un trigger que actualiza el PR de peso al insertar una serie. Los PRs de repeticiones, volumen, racha y pasos se calculan o muestran en cliente según el flujo; no existe un motor SQL completo para todos los tipos.

---

## 11. Persistencia y repositorio Supabase

[`src/lib/repository.ts`](src/lib/repository.ts) es el adaptador entre el modelo frontend y las tablas PostgreSQL.

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

La lectura depende de RLS para decidir qué filas puede ver el usuario. La función no carga las tablas `couples`, `couple_members` ni `strategy_versions`.

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

La migración completa está en [`supabase/migrations/20260828000000_initial_schema.sql`](supabase/migrations/20260828000000_initial_schema.sql).

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

couples ───────< couple_members >──── profiles

profiles ───────< strategy_versions
```

### Tablas

#### `couples`

| Campo | Tipo/regla | Descripción |
|---|---|---|
| `id` | `uuid`, PK | Identificador del espacio de pareja. |
| `name` | `text`, requerido | Nombre del espacio; por defecto `Train Together`. |
| `created_at` | `timestamptz` | Fecha de creación UTC. |

#### `profiles`

| Campo | Tipo/regla | Descripción |
|---|---|---|
| `id` | `uuid`, PK/FK | Referencia a `auth.users(id)`, cascade al borrar. |
| `username` | `text`, unique | Debe estar en minúsculas. |
| `display_name` | `text` | Nombre visible. |
| `first_name` | `text` | Nombre corto utilizado en mensajes. |
| `avatar_url` | `text` nullable | URL de avatar. |
| `height_cm` | `numeric(5,1)` nullable | Altura positiva. |
| `weight_kg` | `numeric(5,1)` nullable | Peso positivo. |
| `daily_step_goal` | `integer` | Meta positiva, por defecto 10000. |
| `daily_calorie_goal` | `integer` | Meta positiva, por defecto 2000. |
| `active` | `boolean` | Perfil activo; por defecto `true`. |
| `created_at`, `updated_at` | `timestamptz` | Auditoría básica. |

#### `couple_members`

Tabla de unión entre `couples` y `profiles`.

- PK compuesta: `couple_id,user_id`.
- `user_id` es `unique`, por lo que cada usuario solo puede pertenecer a un espacio.
- Las dos FKs tienen `on delete cascade`.
- El esquema permite técnicamente más de dos miembros; la regla de exactamente dos usuarios se gestiona fuera de una constraint de base de datos.

#### `nutrition_plans`

- `user_id` es FK a `profiles` y `unique`.
- Contiene `calories`, `protein`, `carbs`, `fats`, `fiber`, `notes` y `starts_on`.
- Todos los objetivos nutricionales son no negativos; las calorías deben ser positivas.

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

Trigger `after insert` sobre `auth.users`. Crea un registro base en `profiles` usando `username`, `display_name` y `first_name` de `raw_user_meta_data` o del email técnico.

### `is_couple_member(target_user_id)`

Función `security definer` que devuelve `true` si el usuario autenticado y el usuario objetivo pertenecen al mismo `couple_id`.

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
| `couples` | Miembros del couple. | No hay policy de escritura de usuario. |
| `profiles` | Perfil propio o miembro de la misma pareja. | Solo el propio perfil. |
| `couple_members` | Propio o miembro de la misma pareja. | No hay policy de escritura de usuario. |
| `nutrition_plans` | Solo propio. | Solo propio. |
| `exercises` | Cualquier usuario autenticado. | No hay policy de escritura de usuario. |
| `workout_days` | Solo propio. | Solo propio. |
| `workout_exercises` | Según pertenencia al día propio. | Solo si el día pertenece al usuario. |
| `workout_sessions` | Propio o pareja. | Solo propias. |
| `exercise_sets` | Si la sesión pertenece al usuario o a su pareja. | Solo si la sesión es propia. |
| `daily_metrics` | Propio o pareja. | Solo propias. |
| `personal_records` | Propio o pareja. | Solo propios. |
| `activity_events` | Propio o pareja. | Solo propios. |
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

La migración añade a `supabase_realtime` y configura `replica identity full` para:

- `workout_sessions`
- `exercise_sets`
- `daily_metrics`
- `personal_records`
- `activity_events`

`supabase/scripts/verify.sql` comprueba esta configuración.

### Suscripción frontend

`subscribeToFitnessChanges()` crea el canal `fitness-couple-updates` y escucha todos los eventos `postgres_changes` de esas cinco tablas. Ante cualquier evento:

1. se actualiza `lastSyncedAt`;
2. se ejecuta `refreshFromRemote()`;
3. se reemplaza el estado completo por el resultado de las ocho consultas.

No se implementa un merge granular por fila ni resolución de conflictos. Tampoco se suscriben cambios de perfiles, nutrición, días, planes o catálogo de ejercicios.

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
| `yarn seed` | Crea/actualiza usuarios, perfiles, pareja, planes, sesiones, métricas, PRs y eventos demo. |
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
- inserta el espacio de pareja y sus miembros;
- transforma el estado demo al esquema SQL;
- upsertea sesiones, series, métricas, PRs y eventos.

Requiere contraseñas por variables de entorno:

```text
FACUNDO_PASSWORD=<valor seguro>
MARIA_PASSWORD=<valor seguro>
```

No se deben escribir esos valores en el Markdown, en el repositorio ni en el historial Git.

### `supabase/seed/seed.sql`

Es un seed SQL mínimo que:

- crea/actualiza el couple conocido;
- crea perfiles para usuarios Auth con emails técnicos;
- asocia usuarios a la pareja;
- crea planes nutricionales base.

No reemplaza a `yarn seed` para poblar todo el estado demo ni el catálogo completo.

### `scripts/db-check.ts`

Comprueba mediante service role:

- acceso a las tablas principales;
- cantidad de filas;
- ejecución de `health_check`;
- cantidad de usuarios Auth;
- presencia mínima de dos perfiles, una pareja y ejercicios.

### `supabase/config.toml`

Configuración local destacada:

- proyecto: `train-together`;
- API: puerto `54321`;
- PostgreSQL: puerto `54322`;
- Studio: puerto `54323`;
- Inbucket: puertos `54324–54326`;
- PostgreSQL major version: 15;
- signup deshabilitado;
- confirmación de email deshabilitada;
- `site_url`: `http://localhost:5173`;
- redirect adicional: `http://127.0.0.1:5173`.

---

## 18. Configuración de entorno

La plantilla es [`.env.example`](.env.example):

| Variable | Consumidor | Sensibilidad |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend y scripts. | Pública dentro de la aplicación, pero específica del proyecto. |
| `VITE_SUPABASE_ANON_KEY` | Frontend. | Pública por diseño; RLS debe estar correctamente configurado. |
| `SUPABASE_SERVICE_ROLE_KEY` | `seed.ts`, `seed-exercises.ts`, `db-check.ts`. | Secreta; nunca exponer al navegador. |
| `SUPABASE_DB_URL` | Declarada en plantilla, no utilizada actualmente por los scripts. | Debe tratarse como secreta si se utiliza posteriormente. |
| `EXERCISES_DATA_URL` | `seed-exercises.ts`, opcional. | URL configurable, no es secreto. |
| `FACUNDO_PASSWORD` | `seed.ts`, requerida al crear Facundo. | Secreta. |
| `MARIA_PASSWORD` | `seed.ts`, requerida al crear María. | Secreta. |

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

Después de obtener desde `supabase status` la URL y la clave anónima, se deben cargar en `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Los scripts ejecutados con `tsx` leen `process.env` directamente y no cargan `.env` por sí mismos; para poblar usuarios y datos demo completos hay que exportar explícitamente sus variables en la sesión de terminal. En PowerShell, por ejemplo:

```powershell
$env:VITE_SUPABASE_URL = "<url reportada por supabase status>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
$env:FACUNDO_PASSWORD = "<password segura>"
$env:MARIA_PASSWORD = "<password segura>"
```

Después, ejecutar:

```bash
yarn seed
yarn seed:exercises
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
yarn db:check
yarn build
yarn preview
```

Antes de `yarn seed`, `yarn seed:exercises` y `yarn db:check`, exportar en la sesión de terminal `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y, para `seed`, `FACUNDO_PASSWORD` y `MARIA_PASSWORD`, tal como se muestra en el ejemplo de PowerShell anterior. `SUPABASE_SERVICE_ROLE_KEY` solo debe existir en la máquina o job seguro que ejecuta el seed. El hosting del frontend solo necesita las variables `VITE_*`.

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

La suite actual está en [`tests/fitness-logic.test.ts`](tests/fitness-logic.test.ts), con entorno `jsdom` configurado en `vitest.config.ts`.

Cubre diez casos relacionados con:

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

No existen actualmente tests de componentes, integración real con Supabase, RLS, Realtime, navegación E2E o accesibilidad automatizada.

### Verificación ejecutada durante la documentación

| Comando | Resultado observado |
|---|---|
| `yarn lint` | Correcto, sin warnings. |
| `yarn typecheck` | Correcto. |
| `yarn test` | Correcto: 1 archivo y 10 tests aprobados. |
| `yarn build` | Correcto: `tsc -b` y build de Vite completados. |

El build usa lazy chunks para páginas y manual chunks para React, Motion, Charts, Supabase, iconos e i18n.

---

## 24. Limitaciones y riesgos técnicos conocidos

Esta sección describe el comportamiento actual para evitar confundir la documentación con una lista de funcionalidades futuras.

1. **Persistencia local de datos de dominio.** `FitnessProvider` guarda el `AppState` completo en `localStorage`, incluyendo perfiles, sesiones y métricas. Es útil como fallback demo, pero no ofrece cifrado ni control de acceso real.
2. **Hash local no equivalente a Auth de producción.** El fallback usa SHA-256 en el cliente sin salt ni política de credenciales. Solo debe usarse para demostración.
3. **Persistencia remota fire-and-forget.** La UI confirma el cambio antes de conocer el resultado de Supabase. Los errores solo se registran en consola y no existe outbox/retry/conflict resolution.
4. **Indicador Realtime simplificado.** `isRealtimeConnected` se basa principalmente en la presencia de configuración, no en el estado real del canal.
5. **Refresh completo ante cada evento.** Un cambio en una tabla Realtime vuelve a consultar todo el estado, lo que es simple pero puede ser costoso con más datos.
6. **Cobertura parcial de Realtime.** No se publican ni suscriben cambios de perfiles, nutrición, días o planes de estrategia.
7. **Eventos potencialmente duplicados.** `completeSession` crea un evento desde el frontend y la migración también tiene un trigger que crea `workout_completed` al pasar la sesión a `completed`. En modo remoto deben revisarse los duplicados.
8. **PR de peso duplicado en responsabilidad.** El frontend calcula un PR al registrar una serie y PostgreSQL también lo calcula con un trigger. La constraint/upsert reduce duplicados de fila, pero la lógica debería tener una única fuente de verdad.
9. **Versionado no conectado.** `strategy_versions` existe en SQL y en `database.ts`, pero no se carga ni se utiliza en la interfaz.
10. **Modelo de pareja simplificado en UI.** El backend contempla `couples` y `couple_members`, pero la aplicación carga perfiles y toma el perfil distinto como pareja.
11. **Exactly-two no enforced.** La base de datos permite más de dos miembros aunque el producto está pensado para dos usuarios.
12. **Reordenamiento limitado.** El drag and drop nativo se implementa para días; no hay drag and drop de ejercicios dentro de la rutina ni librería especializada para soporte táctil completo.
13. **Rangos analíticos.** El rango `all` de progreso está limitado a 21 días en el código actual.
14. **Localización residual.** Existen algunos textos directos en inglés o labels accesibles no incluidos en los recursos de i18n.
15. **Media externa.** Las imágenes/GIF demo usan GitHub raw/Unsplash en runtime; una caída externa afecta la presentación aunque el catálogo esté en Supabase.
16. **Métricas manuales.** No hay integración con relojes, wearables, calorías automáticas ni fuentes de actividad externas.
17. **Recalculo de récords.** Al borrar una serie no hay un proceso general que recalcule todos los PRs derivados.
18. **Tipos Supabase no generados.** `src/types/database.ts` es un contrato manual y el cliente exportado en `src/lib/supabase.ts` no está parametrizado con `Database`, por lo que parte de la seguridad de tipos se pierde en las consultas.
19. **Seed SQL parcial.** `supabase/seed/seed.sql` depende de que existan usuarios Auth y cubre un subconjunto del estado; el seed completo está en `scripts/seed.ts`.
20. **Sin despliegue declarado.** No hay configuración de hosting, variables de producción, migración automatizada de secretos, CI ni estrategia de rollback en el repositorio.

---

## 25. Recomendaciones de evolución

### Prioridad alta

1. Elegir una única fuente de verdad para eventos de finalización y PRs, evitando que frontend y triggers creen el mismo dato.
2. Añadir tests SQL para RLS, triggers, función `is_couple_member` y publicación Realtime.
3. Generar tipos oficiales con Supabase y utilizar `SupabaseClient<Database>`.
4. Sustituir la persistencia fire-and-forget por operaciones con estado de error, reintento y cola offline si se requiere robustez.
5. Desactivar el modo demo/local en builds de producción o marcarlo explícitamente como no seguro.
6. Definir un modelo de autorización de pareja que consulte y valide `couple_members` en lugar de inferir la pareja desde el array de perfiles.

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
| Rutas y protección | [`src/App.tsx`](src/App.tsx) |
| Bootstrap de React | [`src/main.tsx`](src/main.tsx) |
| Estado fitness | [`src/contexts/FitnessContext.tsx`](src/contexts/FitnessContext.tsx) |
| Estado auth | [`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx) |
| Cliente Supabase/Realtime | [`src/lib/supabase.ts`](src/lib/supabase.ts) |
| Adaptador de persistencia | [`src/lib/repository.ts`](src/lib/repository.ts) |
| Login | [`src/lib/auth.ts`](src/lib/auth.ts) |
| Analítica | [`src/lib/analytics.ts`](src/lib/analytics.ts) |
| Lógica de Live Training | [`src/lib/live.ts`](src/lib/live.ts) |
| Tipos de dominio | [`src/types/index.ts`](src/types/index.ts) |
| Tipos de base de datos | [`src/types/database.ts`](src/types/database.ts) |
| Estado demo | [`src/data/demo.ts`](src/data/demo.ts) |
| Traducciones | [`src/i18n.ts`](src/i18n.ts) |
| Sistema visual | [`src/index.css`](src/index.css) |
| Componentes UI | [`src/components/ui/index.tsx`](src/components/ui/index.tsx) |
| Esquema, funciones, RLS y Realtime | [`supabase/migrations/20260828000000_initial_schema.sql`](supabase/migrations/20260828000000_initial_schema.sql) |
| Seed completo | [`scripts/seed.ts`](scripts/seed.ts) |
| Importación de ejercicios | [`scripts/seed-exercises.ts`](scripts/seed-exercises.ts) |
| Diagnóstico de DB | [`scripts/db-check.ts`](scripts/db-check.ts) |
| Tests | [`tests/fitness-logic.test.ts`](tests/fitness-logic.test.ts) |
| Variables de entorno | [`.env.example`](.env.example) |

---

## 27. Conclusión

El proyecto ya constituye una aplicación funcional de entrenamiento para dos personas, no únicamente un mockup visual: tiene navegación protegida, estado de dominio, persistencia Supabase, migración PostgreSQL, RLS, triggers, Realtime, seeds, analítica, tests y build de producción.

La arquitectura es apropiada para una aplicación pequeña y privada: React mantiene la experiencia interactiva, `FitnessContext` centraliza las mutaciones y Supabase proporciona autenticación, base de datos y sincronización. Para escalar hacia un uso de producción más exigente, las áreas críticas son la consistencia entre triggers y lógica de cliente, el control de errores de persistencia, el uso de tipos Supabase generados, la validación explícita de la relación de pareja y la cobertura de pruebas de seguridad/integración.

# MASTER PROMPT — FITNESS COUPLE APP
## Complete End-to-End Product, UX, Frontend, Backend, Database and Realtime Implementation

Quiero que construyas de principio a fin una aplicación web completa de entrenamiento y seguimiento físico para dos usuarios que la utilizarán como pareja.

No quiero solamente un prototipo visual, mockup o conjunto de componentes. Quiero una aplicación funcional, conectada a Supabase, con persistencia real, autenticación simple, Realtime, internacionalización, entrenamiento manual, Live Training, estrategia nutricional/deportiva, estadísticas y sincronización inmediata entre ambos usuarios.

La aplicación debe estar preparada para ejecutarse localmente y posteriormente desplegarse.

---

# 1. VISIÓN DEL PRODUCTO

La aplicación será una plataforma privada de entrenamiento para una pareja.

Cada usuario tendrá:

- su propio perfil
- sus propios objetivos
- su propia estrategia
- sus propios días de entrenamiento
- su propia rutina
- sus propios ejercicios
- sus propias metas de pasos
- sus propias metas calóricas
- sus propios macros
- sus propios registros de peso
- sus propios registros de series y repeticiones
- sus propias sensaciones
- su propio historial
- sus propios gráficos
- su propio progreso

Pero ambos usuarios podrán consultar el progreso del otro.

Concepto principal:

> TRAIN TOGETHER. GROW TOGETHER.

La aplicación debe sentirse como un producto premium de fitness/wellness, no como un CRUD administrativo.

Debe existir una diferencia clara entre:

### ESTRATEGIA
Lo que está planificado.

### ENTRENAMIENTO MANUAL
Lo que el usuario decide registrar de forma tradicional.

### LIVE TRAINING
El modo guiado que acompaña al usuario durante el entrenamiento paso por paso.

Todo lo registrado mediante Live Training debe terminar formando parte de las mismas estadísticas, historial y progreso de la aplicación.

---

# 2. STACK OBLIGATORIO

Utilizar:

- React
- Vite
- TypeScript
- React Router
- Supabase
- PostgreSQL
- Supabase Realtime
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React
- Yarn como package manager

IMPORTANTE:

Utilizar Yarn exclusivamente como manejador de paquetes.

Todos los comandos, README y scripts deben utilizar:

```bash
yarn install
yarn dev
yarn build
yarn lint
```

No utilizar npm como instrucción principal.

Si se generan lockfiles, utilizar:

```text
yarn.lock
```

No generar `package-lock.json`.

---

# 3. REPOSITORIO DE EJERCICIOS

Utilizar como fuente de ejercicios el siguiente repositorio:

https://github.com/hasaneyldrm/exercises-dataset

Este repositorio debe utilizarse como fuente para construir o poblar la biblioteca inicial de ejercicios.

Analizar la estructura real del repositorio antes de implementar la integración.

No asumir el formato de sus archivos sin inspeccionarlos.

Utilizar los datos disponibles para obtener, cuando existan:

- nombre
- descripción
- instrucciones
- grupo muscular
- equipamiento
- imágenes
- videos
- músculos involucrados
- categorías
- metadatos relevantes

Adaptar el esquema de la aplicación al contenido real disponible.

IMPORTANTE:

No depender de GitHub como única fuente de datos en runtime si eso perjudica la estabilidad de la aplicación.

La solución preferida es:

1. tomar el dataset
2. normalizarlo
3. ejecutar un script de importación/seed
4. almacenar los ejercicios relevantes en Supabase

De esta forma la aplicación consulta Supabase y no depende constantemente de GitHub.

Agregar un script reproducible para volver a importar o actualizar el dataset.

Por ejemplo:

```bash
yarn seed:exercises
```

o una alternativa equivalente.

Documentarlo en README.

---

# 4. USUARIOS

Habrá exactamente DOS usuarios.

No implementar:

- registro público
- OAuth
- Google
- Facebook
- Apple
- magic links
- recuperación de contraseña
- verificación de email
- sistema complejo de roles

Habrá dos cuentas predefinidas.

El login será:

- username
- password

Las contraseñas NO deben almacenarse en texto plano.

Utilizar un mecanismo seguro de hashing.

Los usuarios deben permanecer autenticados mediante una sesión persistente.

Cada usuario debe acceder únicamente a sus datos privados, mientras que determinadas estadísticas de progreso de ambos podrán visualizarse en la sección de pareja.

---

# 5. SUPABASE COMO BACKEND PRINCIPAL

Supabase será responsable de:

- PostgreSQL
- persistencia
- autenticación/sesión según la implementación elegida
- Realtime
- consultas
- políticas de acceso
- almacenamiento de datos

No guardar datos fundamentales exclusivamente en:

- localStorage
- sessionStorage
- memoria de React

localStorage puede utilizarse únicamente para preferencias no críticas, como preferencias visuales o estado temporal.

---

# 6. SUPABASE REALTIME — REQUISITO OBLIGATORIO

La aplicación DEBE utilizar Supabase Realtime.

No basta con instalar una librería.

Debe configurarse correctamente el proyecto de Supabase.

El resultado final debe permitir que ciertos cambios se propaguen automáticamente entre ambos usuarios.

Ejemplo:

María termina un entrenamiento.

Facundo tiene abierta la aplicación.

El dashboard/progreso/actividad de María debe actualizarse automáticamente para Facundo sin refrescar la página.

Implementar Realtime en las tablas necesarias, especialmente las relacionadas con:

- workout_sessions
- exercise_sets
- daily_metrics
- personal_records
- activity_events
- datos necesarios para progreso de pareja

Evaluar qué tablas necesitan eventos en tiempo real y configurar solamente aquellas que aporten valor.

---

# 7. SCRIPTS DE CONFIGURACIÓN DE DATABASE

No quiero depender de una configuración manual difícil de repetir.

Generar todos los scripts SQL necesarios para crear y configurar la base de datos.

Crear, como mínimo:

```text
supabase/
├── migrations/
├── seed/
└── scripts/
```

Las migraciones deben crear:

- tablas
- relaciones
- índices
- constraints
- funciones
- triggers
- RLS policies
- publicación/configuración necesaria para Realtime
- cualquier función necesaria para estadísticas o eventos

Crear scripts idempotentes o razonablemente seguros para ejecutar durante una configuración nueva.

Debe existir documentación exacta indicando cómo configurar una instancia limpia de Supabase.

---

# 8. DATABASE SCHEMA

Diseñar una arquitectura relacional robusta.

## profiles

Campos sugeridos:

- id
- username
- display_name
- password_hash o mecanismo equivalente
- avatar_url
- height
- weight
- daily_step_goal
- daily_calorie_goal
- active
- created_at
- updated_at

---

# 9. ESTRATEGIA

Crear una sección principal llamada:

# ESTRATEGIA

La estrategia representa el plan actual del usuario.

Debe permitir cargar y visualizar objetivos generales y objetivos diarios/semanales.

Separar conceptualmente:

### Nutrición

- calorías objetivo
- proteínas
- carbohidratos
- grasas
- opcionalmente fibra
- notas

### Actividad

- pasos diarios objetivo
- calorías objetivo
- días de entrenamiento por semana
- objetivo de minutos activos, si se desea

### Entrenamiento

- días de entrenamiento
- ejercicios
- series
- repeticiones
- peso objetivo
- descanso
- orden
- notas

---

# 10. PLAN NUTRICIONAL

Cada usuario debe poder definir su objetivo nutricional actual.

Ejemplo:

```text
CALORIES
2200 kcal

PROTEIN
180 g

CARBS
220 g

FATS
70 g
```

Permitir editar los objetivos.

Mostrar también un resumen visual.

No implementar un sistema avanzado de dieta/médico.

Esto es únicamente seguimiento de objetivos introducidos manualmente por el usuario.

---

# 11. OBJETIVO DE PASOS

Dentro de Estrategia:

Ejemplo:

10.000 pasos diarios.

Poder modificarlo.

En dashboard y progreso debe utilizarse este objetivo.

---

# 12. OBJETIVO DE ENTRENAMIENTO

Permitir definir:

- cantidad de entrenamientos semanales
- días asignados
- duración esperada
- objetivos adicionales

Ejemplo:

```text
4 workouts / week
Monday
Tuesday
Thursday
Saturday
```

---

# 13. PLANIFICACIÓN DE LA RUTINA

La sección Estrategia debe permitir crear y modificar:

- días
- rutinas
- ejercicios
- orden
- series
- repeticiones
- peso objetivo
- descanso
- notas

Ejemplo:

```text
MONDAY — LEGS

Squat
4 sets
10 reps
60 kg
90 sec rest

Romanian Deadlift
3 sets
10 reps
50 kg
90 sec rest

Hip Thrust
4 sets
12 reps
70 kg
60 sec rest
```

---

# 14. ESTRATEGIA Y VERSIONADO

Cuando resulte razonable, almacenar fechas de inicio de estrategia.

Permitir distinguir:

- estrategia actual
- estrategias anteriores

Esto permitirá posteriormente analizar la evolución.

No es necesario crear un sistema empresarial de versionado extremadamente complejo, pero los cambios importantes de estrategia no deberían destruir la información histórica de entrenamientos pasados.

---

# 15. WORKOUT DAYS

Tabla conceptual:

```text
workout_days
```

Campos:

- id
- user_id
- name
- description
- weekday
- order_index
- active
- created_at
- updated_at

---

# 16. EXERCISES

Tabla:

```text
exercises
```

Campos sugeridos:

- id
- external_id
- name
- description
- instructions
- muscle_group
- equipment
- video_url
- thumbnail_url
- image_url
- source
- source_url
- metadata
- created_at
- updated_at

Mantener referencia al dataset original cuando sea útil.

---

# 17. WORKOUT EXERCISES

Tabla:

```text
workout_exercises
```

Campos:

- id
- workout_day_id
- exercise_id
- order_index
- sets
- target_reps
- target_weight
- rest_seconds
- notes
- created_at
- updated_at

---

# 18. EJERCICIOS CON MOVILIDAD

La rutina debe soportar ejercicios que tengan:

- número fijo de series
- repeticiones
- repeticiones variables
- tiempo en segundos
- distancia
- peso corporal
- peso externo
- descanso

Diseñar el modelo de forma flexible.

No asumir que absolutamente todos los ejercicios son `sets × reps × weight`.

---

# 19. EJERCICIO MODAL

Al tocar un ejercicio:

abrir modal en desktop.

En mobile:

bottom sheet / fullscreen sheet.

Mostrar:

- nombre
- video o GIF si existe
- imagen
- grupo muscular
- equipamiento
- descripción
- instrucciones
- errores frecuentes si existen
- series
- repeticiones
- descanso
- peso objetivo

Debe poder utilizarse tanto desde la rutina como desde Live Training.

---

# 20. ENTRENAMIENTO MANUAL

Debe existir una forma tradicional de registrar entrenamiento.

El usuario puede ingresar a un día y registrar manualmente:

- peso
- repeticiones
- series
- RPE / dificultad
- sensación
- dolor/molestia
- descanso
- comentario

Esto representa el método de carga manual.

---

# 21. LIVE TRAINING

Crear una experiencia completamente diferente llamada:

# LIVE TRAINING

Inspirarse conceptualmente en aplicaciones tipo Tabata, pero adaptada a rutinas de gimnasio.

Live Training debe tomar la rutina planificada en Estrategia y convertirla en un flujo guiado.

Ejemplo:

```text
LEG DAY

Exercise 1 / 5

SQUAT

SET 1 / 4

60 KG
10 REPS
```

Botón:

`COMPLETE SET`

---

# 22. FLUJO LIVE TRAINING

El flujo debe ser:

Seleccionar entrenamiento

↓

Comenzar

↓

Ejercicio actual

↓

Serie actual

↓

Registrar resultados

↓

Completar serie

↓

Descanso

↓

Siguiente serie

↓

Descanso

↓

Siguiente ejercicio

↓

...

↓

Workout completed

↓

Feedback general

↓

Guardar sesión

↓

Actualizar estadísticas

↓

Actualizar pareja en tiempo real

---

# 23. REPETICIÓN AUTOMÁTICA DE SERIES

Live Training debe utilizar automáticamente la cantidad de series definida en Estrategia.

Ejemplo:

Estrategia:

```text
Squat
4 sets
10 reps
60 kg
90 sec rest
```

Live Training debe mostrar:

Set 1 / 4

↓

Set 2 / 4

↓

Set 3 / 4

↓

Set 4 / 4

↓

Siguiente ejercicio

No pedir al usuario que introduzca manualmente qué número de serie está haciendo, salvo que se permita cambiar la configuración.

---

# 24. REGISTRO DURANTE LIVE TRAINING

Durante cada serie el usuario podrá registrar:

- peso realizado
- repeticiones realizadas
- RPE / dificultad
- sensación
- dolor
- comentario

El valor planificado debe aparecer junto al real.

Ejemplo:

```text
PLANNED
60 kg × 10

ACTUAL
65 kg × 8
```

Esto permitirá medir posteriormente:

Planificado vs Realizado.

---

# 25. DESCANSO AUTOMÁTICO

Si el ejercicio tiene:

```text
rest_seconds > 0
```

entonces, al completar una serie:

iniciar automáticamente una cuenta regresiva.

Ejemplo:

```text
REST

01:30
```

Mostrar un contador grande y muy visible.

Permitir:

- pausar
- continuar
- saltar
- añadir tiempo
- reducir tiempo

Cuando llegue a cero:

mostrar una señal visual y/o sonora opcional.

---

# 26. SIN DESCANSO PAUTADO

Si:

```text
rest_seconds = 0
```

NO mostrar un contador falso.

Mostrar un estado sencillo:

```text
DESCANSA

Cuando estés listo continúa.
```

o, dependiendo del idioma:

```text
REST

Continue when you're ready.
```

El formulario de registro debe seguir estando disponible durante esta etapa.

---

# 27. FORMULARIO DURANTE EL DESCANSO

El descanso debe aprovecharse para registrar los datos.

Mostrar:

```text
HOW DID IT FEEL?

Weight
Reps
RPE
Feeling
Pain
Notes
```

El usuario puede completar esos datos mientras corre el timer.

No obligar a esperar que termine el timer para poder registrarlos.

---

# 28. EXPERIENCIA TABATA-LIKE

Live Training debe tener una interfaz muy enfocada en el momento actual.

Durante el entrenamiento:

- reducir distracciones
- destacar ejercicio actual
- destacar serie
- mostrar progreso
- mostrar timer
- mostrar información esencial
- permitir registrar datos rápidamente

Utilizar animaciones suaves para cambiar de:

```text
SET
→
REST
→
NEXT SET
```

---

# 29. ESTADO GLOBAL DEL LIVE TRAINING

El estado de Live Training debe estar centralizado y ser consistente.

Debe saber:

- sesión actual
- ejercicio actual
- índice del ejercicio
- serie actual
- cantidad total de series
- tiempo restante
- estado actual
- datos introducidos
- ejercicios completados
- series completadas

No permitir inconsistencias como:

- mostrar Set 3/4 cuando internamente es Set 2
- avanzar dos ejercicios accidentalmente
- perder los datos al cerrar un modal

---

# 30. GUARDADO DURANTE LIVE TRAINING

No esperar exclusivamente hasta el final para persistir todo.

Persistir progresivamente los datos importantes.

Ejemplo:

Cada serie completada debe almacenarse.

Esto permite:

- recuperar la sesión
- reducir riesgo de pérdida de información
- alimentar Realtime
- generar actividad
- consultar progreso

Si la aplicación se recarga durante una sesión, intentar recuperar el estado de la sesión activa cuando sea posible.

---

# 31. FINAL DEL LIVE TRAINING

Al completar el último ejercicio:

mostrar:

```text
WORKOUT COMPLETE
```

Resumen:

- duración
- ejercicios completados
- series completadas
- volumen total
- peso máximo
- repeticiones totales
- sensación
- energía
- fatiga
- ánimo

Luego:

```text
HOW WAS YOUR WORKOUT?
```

Permitir registrar feedback general.

---

# 32. FEEDBACK GENERAL

Campos:

### Energy
1–5

### Fatigue
1–5

### Mood
1–5

### Difficulty
1–10

### Overall feeling

😫 Very bad
😕 Bad
😐 Neutral
🙂 Good
🔥 Excellent

### Notes

Textarea libre.

---

# 33. EXERCISE SET MODEL

Crear:

```text
exercise_sets
```

Campos:

- id
- session_id
- exercise_id
- set_number
- planned_weight
- actual_weight
- planned_reps
- actual_reps
- difficulty
- feeling
- pain_level
- rest_seconds
- notes
- completed_at

Así será posible comparar lo planificado con lo realizado.

---

# 34. WORKOUT SESSIONS

Crear:

```text
workout_sessions
```

Campos:

- id
- user_id
- workout_day_id
- started_at
- finished_at
- duration_seconds
- overall_feeling
- energy
- fatigue
- mood
- difficulty
- notes
- status

Estados:

- active
- completed
- abandoned

---

# 35. MÉTRICAS DIARIAS

Crear:

```text
daily_metrics
```

Campos:

- id
- user_id
- date
- steps
- calories
- body_weight
- notes
- created_at
- updated_at

Los pasos y calorías inicialmente serán introducidos manualmente.

No implementar todavía integraciones con wearables.

Diseñar el modelo para que posteriormente sea posible hacerlo.

---

# 36. DASHBOARD

El dashboard debe mostrar información útil inmediatamente.

Ejemplo:

```text
GOOD MORNING, MARÍA

Today's progress

8,432 / 10,000 steps

1,520 / 2,000 kcal
```

Luego:

```text
TODAY'S WORKOUT

Leg Day

6 exercises
~48 min

START LIVE TRAINING
```

Mostrar:

- racha
- progreso
- actividad
- objetivos
- entrenamiento del día
- pareja

---

# 37. PROGRESO

Crear sección:

# PROGRESS

Mostrar gráficos animados.

Gráficos recomendados:

- evolución de pesos
- volumen de entrenamiento
- entrenamientos por semana
- pasos
- calorías
- peso corporal
- RPE
- sensaciones
- adherencia a la estrategia
- planificado vs realizado

Filtros:

- 7 días
- 30 días
- 3 meses
- 6 meses
- todo

---

# 38. PLANIFICADO VS REALIZADO

Este es un requisito importante.

Como existe la sección Estrategia y Live Training, poder comparar:

```text
PLANNED
60 kg × 10

ACTUAL
65 kg × 8
```

Y generar indicadores como:

- cumplimiento de series
- cumplimiento de repeticiones
- cumplimiento de peso
- cumplimiento de entrenamientos
- cumplimiento de pasos
- cumplimiento de calorías

No convertirlo en una evaluación médica.

Simplemente mostrar adherencia y evolución.

---

# 39. PERSONAL RECORDS

Detectar automáticamente:

- mayor peso
- mayor cantidad de repeticiones
- mayor volumen
- mayor peso para un número dado de repeticiones
- mejor semana
- mayor racha
- mayor cantidad de pasos

Mostrar nuevos PR mediante microanimaciones.

---

# 40. COUPLE / PAREJA

Crear una sección:

# OUR PROGRESS

Mostrar tarjetas para ambos usuarios.

Ejemplo:

```text
FACUNDO
18 workouts
82,430 steps
12 PRs

MARÍA
16 workouts
74,210 steps
8 PRs
```

Mostrar comparaciones sin convertirlo en competencia.

La finalidad es motivacional.

---

# 41. REALTIME COUPLE ACTIVITY

Crear un feed.

Ejemplos:

```text
❤️ María completed Leg Day

🔥 Facundo reached his step goal

🏆 María achieved a new PR

💪 Facundo completed today's workout
```

Estos eventos deben generarse a partir de acciones reales.

No utilizar información falsa o hardcodeada después de inicializar el seed.

---

# 42. ACTIVITY EVENTS

Crear tabla:

```text
activity_events
```

Campos:

- id
- user_id
- event_type
- title
- description
- entity_type
- entity_id
- metadata
- created_at

Usar esta tabla para:

- actividad de pareja
- notificaciones internas
- historial resumido

---

# 43. PERFIL

Cada usuario:

- nombre
- avatar
- altura
- peso
- objetivos
- estadísticas
- PRs
- racha
- entrenamientos

Permitir edición.

---

# 44. BIBLIOTECA DE EJERCICIOS

Crear una pantalla para explorar ejercicios.

Permitir:

- búsqueda
- filtros
- músculo
- equipamiento
- nombre

Los datos iniciales deben provenir del dataset mencionado anteriormente.

---

# 45. ADMINISTRACIÓN DE ESTRATEGIA

El usuario debe poder editar visualmente su estrategia.

Poder:

- crear día
- renombrar día
- eliminar día
- reordenar días
- agregar ejercicio
- buscar ejercicio
- arrastrar ejercicios
- duplicar ejercicio
- eliminar ejercicio
- cambiar series
- cambiar reps
- cambiar peso
- cambiar descanso
- editar notas

Todo debe persistirse en Supabase.

---

# 46. DRAG AND DROP

Utilizar una solución moderna y mantenible.

El drag & drop debe funcionar en:

- desktop
- mobile cuando sea razonable

No romper la usabilidad táctil.

---

# 47. INTERNACIONALIZACIÓN

Toda la aplicación debe soportar:

- Español
- English

NO hardcodear textos directamente dentro de los componentes cuando sean visibles para el usuario.

Utilizar una solución de internacionalización adecuada.

Puede utilizarse, por ejemplo:

- i18next
- react-i18next

La arquitectura debe permitir incorporar nuevos idiomas posteriormente.

---

# 48. IDIOMA

Crear un selector de idioma.

Ejemplo:

```text
ES
EN
```

Persistir la preferencia del usuario.

Traducir:

- navegación
- botones
- formularios
- errores
- estados
- modales
- mensajes
- dashboard
- entrenamiento
- Live Training
- métricas
- estrategia
- pareja
- perfil
- landing
- login
- tooltips
- timers

No dejar textos visibles en inglés si la aplicación está en español.

---

# 49. TERMINOLOGÍA

Cuidar especialmente las traducciones relacionadas con fitness.

Por ejemplo:

Workout
→ Entrenamiento

Set
→ Serie

Reps
→ Repeticiones

Rest
→ Descanso

Strength
→ Fuerza

Feeling
→ Sensación

Difficulty
→ Dificultad

Weight
→ Peso

Steps
→ Pasos

Calories
→ Calorías

Progress
→ Progreso

Strategy
→ Estrategia

No realizar traducciones literales cuando una traducción natural en contexto deportivo sea más adecuada.

---

# 50. LANDING PAGE

Crear una landing antes del login.

Hero:

# TRAIN TOGETHER.
# GROW TOGETHER.

Subtítulo:

"Tu entrenamiento. Tu progreso. Nuestra evolución."

CTA:

"Comenzar"

La landing debe presentar:

- entrenamiento
- live training
- estrategia
- progreso
- couple progress

Debe mostrar previews visuales de la aplicación.

---

# 51. IDENTIDAD VISUAL

Tema exclusivamente oscuro.

No implementar light mode.

Estética:

- glassmorphism
- neon
- futuristic fitness
- premium
- minimalista
- tecnológica

Color dominante:

- violeta
- morado
- magenta
- azul/violeta

Usar:

- transparencias
- blur
- borders semitransparentes
- glow
- radial gradients
- halos de luz
- sombras suaves

Evitar una apariencia excesivamente gamer.

Debe sentirse premium.

---

# 52. COMPONENTES

Crear componentes reutilizables.

Ejemplos:

```text
GlassCard
NeonButton
ProgressRing
WorkoutCard
ExerciseCard
ExerciseModal
ExerciseVideo
SetTracker
LiveTrainingView
RestTimer
FeelingSelector
RPESelector
MetricCard
ChartCard
StrategyCard
StrategyEditor
ExerciseLibrary
ActivityItem
CoupleProgressCard
BottomNavigation
Sidebar
BottomSheet
Modal
Toast
Skeleton
EmptyState
ErrorState
```

---

# 53. MOBILE FIRST

Diseñar primero para:

- 360px
- 390px
- 430px

Luego adaptar a:

- tablet
- laptop
- desktop

En mobile:

- bottom navigation
- cards
- botones grandes
- touch targets adecuados
- formularios rápidos

Live Training debe sentirse especialmente bien en teléfonos.

---

# 54. DESKTOP

En desktop:

- sidebar
- grids
- múltiples cards
- gráficos amplios
- mayor cantidad de información visible

No limitar la aplicación a una vista móvil ampliada.

---

# 55. ANIMACIONES

Utilizar Framer Motion.

Animar:

- navegación
- entrada de páginas
- cards
- modales
- bottom sheets
- progress bars
- gráficos
- cambios entre ejercicios
- cambios entre series
- inicio/final del timer
- workout completion
- PRs

Animaciones rápidas y elegantes.

No sobreanimar.

Soportar `prefers-reduced-motion`.

---

# 56. LIVE TRAINING ANIMATION

Prestar atención especial a la transición:

```text
SET COMPLETE

↓

REST

↓

REST COMPLETE

↓

NEXT SET
```

Y:

```text
LAST SET

↓

EXERCISE COMPLETE

↓

NEXT EXERCISE
```

Debe dar sensación de flujo continuo.

---

# 57. LOADING STATES

Implementar:

- skeletons
- loading spinners donde sean necesarios
- optimistic UI
- error states
- empty states

Nunca mostrar pantallas en blanco mientras se esperan datos.

---

# 58. OPTIMISTIC UI

Cuando el usuario completa una serie:

actualizar inmediatamente la interfaz.

Después persistir.

Si falla:

- revertir
- mostrar error
- permitir reintentar

---

# 59. ERROR HANDLING

Manejar correctamente:

- Supabase offline
- errores de red
- errores de autenticación
- registros duplicados
- datos faltantes
- vídeos inexistentes
- errores de seed
- inconsistencias de estrategia

No dejar errores silenciosos.

---

# 60. RECUPERACIÓN DE SESIONES

Si Live Training queda en estado `active` y el usuario vuelve a abrir la aplicación:

detectar la sesión.

Mostrar:

```text
You have an unfinished workout.

Resume
Discard
```

Traducido según idioma.

---

# 61. HISTORIAL

Crear página:

# HISTORY

Mostrar:

- entrenamientos anteriores
- fecha
- duración
- rutina
- volumen
- sensación

Permitir abrir una sesión anterior y visualizar:

- ejercicios
- series
- pesos
- reps
- sensaciones
- comentarios

---

# 62. ESTADÍSTICAS

Calcular métricas reales a partir de la DB.

No hardcodear estadísticas.

Ejemplos:

- volumen
- frecuencia
- adherencia
- pasos
- calorías
- PRs
- duración
- peso máximo
- repeticiones
- tendencia de RPE

---

# 63. DASHBOARD REALTIME

Cuando una acción relevante ocurra:

actualizar automáticamente:

- dashboard
- progreso
- activity feed
- couple progress
- PR cards
- step goals
- métricas relacionadas

No exigir refresh manual.

---

# 64. SECURITY / RLS

Configurar Row Level Security correctamente.

Cada usuario debe poder consultar/modificar sus propios datos privados.

Los datos que deben ser visibles entre pareja deben exponerse de forma explícita y controlada.

No permitir que una sesión pueda modificar datos del otro usuario.

Generar todas las policies SQL necesarias.

Documentarlas.

---

# 65. TRIGGERS

Evaluar y utilizar PostgreSQL triggers cuando mejoren la consistencia.

Ejemplos:

- `updated_at`
- generación de eventos
- detección de ciertos cambios
- mantenimiento de registros derivados

No utilizar triggers innecesarios.

Preferir lógica clara y mantenible.

---

# 66. PERSONAL RECORD CALCULATION

Implementar lógica real.

Ejemplo conceptual:

Cuando se completa una serie:

comparar contra el historial.

Si representa un nuevo máximo:

crear/actualizar PR.

No mostrar “New PR” simplemente porque el botón se haya presionado.

---

# 67. DAILY GOALS

El dashboard debe calcular:

```text
steps actual / step target

calories actual / calorie target
```

Mostrar progreso.

---

# 68. WORKOUT ADHERENCE

Calcular:

```text
workouts_completed / workouts_planned
```

por:

- semana
- mes
- período seleccionado

Utilizarlo para gráficos.

---

# 69. ESTRATEGIA VS RESULTADO

Mostrar indicadores como:

```text
Workout adherence     92%

Step goal             84%

Training volume       +12%

Planned vs actual load +8%
```

Los cálculos deben salir de los datos existentes.

---

# 70. UX DEL LIVE TRAINING

La prioridad durante Live Training es que el usuario no tenga que pensar demasiado.

Debe poder:

1. mirar el ejercicio
2. hacer la serie
3. registrar peso/reps
4. tocar completar
5. descansar
6. continuar

Todo en pocos movimientos.

---

# 71. ACCESIBILIDAD

Implementar:

- focus states
- labels
- aria labels
- contraste correcto
- navegación de teclado
- botones táctiles
- reduced motion

---

# 72. FECHAS Y TIMEZONE

Guardar timestamps de manera consistente.

Evitar problemas cerca de medianoche.

Los datos diarios:

- pasos
- calorías
- peso

deben asociarse a la fecha local correspondiente.

---

# 73. SEED DATA

Crear seed inicial para:

- dos usuarios
- perfiles
- estrategia
- días
- ejercicios
- rutinas
- datos históricos
- sesiones
- series
- métricas

Crear suficiente información histórica para que los gráficos tengan datos al ejecutar por primera vez.

Los datos deben verse realistas, pero claramente ser datos iniciales/demo.

---

# 74. SCRIPT DE IMPORTACIÓN DE EJERCICIOS

Crear un script dedicado para importar el dataset.

Ejemplo:

```bash
yarn seed:exercises
```

Debe:

1. descargar o leer el dataset
2. interpretar su estructura
3. normalizar datos
4. insertar/actualizar ejercicios
5. evitar duplicados
6. reportar resultados

Ejemplo de salida:

```text
Imported: 850 exercises
Updated: 12
Skipped: 4
Failed: 0
```

Documentarlo.

---

# 75. ENVIRONMENT

Crear:

```text
.env.example
```

con:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No colocar secretos reales.

---

# 76. PACKAGE CONFIGURATION

Crear scripts útiles:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "preview": "...",
    "lint": "...",
    "typecheck": "...",
    "seed": "...",
    "seed:exercises": "...",
    "db:reset": "...",
    "db:seed": "..."
  }
}
```

Adaptar los comandos a la arquitectura final.

Todos los ejemplos deben utilizar Yarn.

---

# 77. SUPABASE SETUP DOCUMENTATION

El README debe explicar exactamente:

1. crear proyecto Supabase
2. configurar variables de entorno
3. ejecutar migraciones
4. configurar Realtime
5. ejecutar seed
6. importar ejercicios
7. iniciar la aplicación

Incluir los comandos exactos.

---

# 78. DATABASE REALTIME SETUP SCRIPT

Crear explícitamente SQL para dejar Realtime configurado.

No asumir que el usuario activará manualmente todas las tablas desde el dashboard de Supabase.

El proceso de instalación debe dejar la configuración tan automatizada como sea posible.

Comprobar la sintaxis y compatibilidad con la versión actual de Supabase utilizada por el proyecto.

---

# 79. DATABASE VALIDATION

Crear una forma de verificar que la DB quedó correctamente configurada.

Por ejemplo:

```bash
yarn db:check
```

Debe verificar:

- conexión
- tablas
- policies
- Realtime/publication
- datos iniciales
- usuarios
- ejercicios

Mostrar errores claros.

---

# 80. TESTING

Agregar pruebas razonables para la lógica más crítica.

Especialmente:

- cálculo de progreso
- cálculo de volumen
- PR detection
- timer
- traducciones
- lógica de Live Training
- cálculo de adherencia

No es necesario construir una suite gigantesca, pero las partes críticas deben estar verificadas.

---

# 81. TYPESCRIPT

Generar tipos para la base de datos.

Preferentemente utilizar los tipos generados por Supabase o una estrategia equivalente.

Evitar:

```ts
any
```

Siempre que sea posible.

---

# 82. UX CONSISTENCY

Todos los componentes deben compartir:

- spacing
- typography
- border radius
- glass surfaces
- shadows
- transitions
- buttons
- inputs

Crear tokens/diseño consistente.

---

# 83. NO FAKE FUNCTIONALITY

No crear:

- botones sin acción
- estadísticas falsas
- datos falsos después del seed
- gráficos hardcodeados
- eventos simulados
- realtime fingido
- timers que no afectan el flujo
- formularios que no guardan

Toda función visible debe ser funcional.

---

# 84. IMPORTANT ARCHITECTURAL RULE

Separar claramente:

```text
PLAN
↓
ESTRATEGIA

REAL EXECUTION
↓
MANUAL TRAINING / LIVE TRAINING

ANALYTICS
↓
PROGRESS

SHARED EXPERIENCE
↓
COUPLE
```

Los datos deben alimentar de forma natural todo el ecosistema.

Ejemplo:

Una modificación en Estrategia:

```text
Squat
4 × 10
60 kg
90 sec
```

debe cambiar lo que aparece en Live Training.

Live Training registra:

```text
Set 1
65 kg
8 reps
RPE 8
```

Eso debe afectar:

- historial
- volumen
- PR
- progreso
- estadísticas
- actividad
- Couple Progress
- Realtime

---

# 85. FLUJO COMPLETO FINAL

El flujo general debe ser:

LANDING

↓

LOGIN

↓

DASHBOARD

↓

ESTRATEGIA

↓

Definir objetivos

↓

Definir pasos

↓

Definir calorías

↓

Definir macros

↓

Definir días

↓

Definir ejercicios

↓

Definir series

↓

Definir reps

↓

Definir peso

↓

Definir descanso

↓

DASHBOARD

↓

TODAY'S WORKOUT

↓

Seleccionar:

MANUAL TRAINING

o

LIVE TRAINING

---

# 86. LIVE TRAINING FLOW

```text
START LIVE TRAINING

↓

Exercise 1

↓

Set 1

↓

Record weight/reps/feeling

↓

Complete Set

↓

Rest timer

↓

Set 2

↓

Record

↓

Complete

↓

Rest

↓

...

↓

Last set

↓

Exercise complete

↓

Next exercise

↓

...

↓

Workout complete

↓

Overall feedback

↓

Persist session

↓

Generate statistics

↓

Detect PR

↓

Generate activity

↓

Realtime update

↓

Couple sees the changes
```

---

# 87. FINAL DEL PRODUCTO

El resultado final debe sentirse como una aplicación que dos personas pueden utilizar diariamente.

Debe ser:

- hermosa
- rápida
- responsive
- intuitiva
- animada
- premium
- funcional
- real
- mantenible

No quiero una simple demo.

Quiero una aplicación funcional de principio a fin.

---

# 88. ENTREGABLES

Entregar:

- código completo
- `package.json`
- `yarn.lock`
- frontend
- componentes
- páginas
- hooks
- servicios
- tipos
- Supabase migrations
- SQL
- RLS policies
- Realtime configuration
- seed
- exercise importer
- `.env.example`
- README
- scripts de DB
- scripts de validación
- datos iniciales
- internacionalización ES/EN

---

# 89. CHECKLIST FINAL OBLIGATORIO

Antes de terminar, comprobar:

[ ] `yarn install` funciona

[ ] `yarn dev` funciona

[ ] `yarn build` funciona

[ ] `yarn typecheck` funciona

[ ] `yarn lint` funciona

[ ] Supabase conecta correctamente

[ ] migraciones funcionan desde DB vacía

[ ] seed funciona

[ ] exercise importer funciona

[ ] dos usuarios pueden iniciar sesión

[ ] Estrategia funciona

[ ] rutina funciona

[ ] drag & drop funciona

[ ] entrenamiento manual funciona

[ ] Live Training funciona

[ ] series se registran

[ ] timer funciona

[ ] descanso sin timer funciona

[ ] feedback funciona

[ ] sesiones se persisten

[ ] historial funciona

[ ] estadísticas funcionan

[ ] gráficos funcionan

[ ] PR detection funciona

[ ] couple progress funciona

[ ] Realtime funciona

[ ] activity feed funciona

[ ] ES funciona

[ ] EN funciona

[ ] mobile funciona

[ ] desktop funciona

[ ] errores se manejan

[ ] RLS está configurado

[ ] Realtime está realmente configurado

[ ] no existen secretos hardcodeados

[ ] no existen botones falsos

[ ] no existen estadísticas hardcodeadas

[ ] no quedan TODOs críticos

---

# 90. INSTRUCCIÓN FINAL AL MODELO

No te limites a describir cómo construir esta aplicación.

CONSTRÚYELA.

Toma decisiones técnicas razonables cuando existan varias alternativas.

No interrumpas el desarrollo para solicitar confirmación sobre decisiones menores.

Prioriza:

1. funcionalidad real
2. arquitectura limpia
3. experiencia mobile
4. Supabase correcto
5. Realtime
6. Live Training
7. Estrategia
8. persistencia
9. estadísticas
10. estética y animaciones

La aplicación debe ser funcional end-to-end.

Cuando termines, revisa el proyecto completo como si fueras un QA senior y corrige cualquier problema evidente antes de considerarlo terminado.
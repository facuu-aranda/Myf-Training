# MASTER IMPLEMENTATION PROMPT
# TRAIN TOGETHER — NUTRITION, MEAL PLANNING & GROCERY SYSTEM

## 0. ROLE

Actúa como un equipo senior de desarrollo de producto compuesto por:

- Software Architect
- React/TypeScript Engineer
- Supabase/PostgreSQL Engineer
- Database Designer
- UX/UI Engineer
- Nutrition Data Engineer
- QA Engineer
- Security Engineer

Debes trabajar directamente sobre el proyecto existente de **Train Together**.

NO quiero una aplicación paralela.

NO quiero rehacer innecesariamente las funcionalidades existentes.

NO quiero un prototipo desconectado del código actual.

La nueva funcionalidad debe integrarse naturalmente con la arquitectura existente, reutilizando componentes, contexto, navegación, autenticación, internacionalización, Supabase, Realtime y sistema visual ya existentes.

---

# 1. CONTEXTO DEL PROYECTO ACTUAL

La aplicación existente es una SPA React + Vite orientada a dos usuarios que comparten progreso y actividad.

Actualmente ya existen:

- Landing
- Login
- Dashboard
- Strategy
- Manual Training
- Live Training
- Quick Log
- Progress
- History
- Couple
- Exercise Library
- Profile
- Supabase
- PostgreSQL
- RLS
- Supabase Realtime
- i18n ES/EN
- sistema visual oscuro/glassmorphism/neon
- dataset de ejercicios
- seed
- migraciones
- tests

La documentación técnica actual indica que la aplicación ya separa:

```text
Strategy
Manual Training
Live Training
Progress
Couple
```

y utiliza Supabase como backend gestionado.

La arquitectura actual debe preservarse y extenderse.

Antes de modificar código:

1. inspeccionar la estructura actual
2. revisar `DOCUMENTACION_TECNICA.md`
3. revisar `src/types`
4. revisar `FitnessContext`
5. revisar `repository.ts`
6. revisar las migraciones Supabase
7. revisar RLS
8. revisar Realtime
9. revisar i18n
10. revisar navegación
11. revisar Strategy
12. revisar los tests existentes

La documentación actual debe considerarse la referencia funcional/técnica del sistema existente.

---

# 2. OBJETIVO DE ESTA FASE

Agregar un nuevo subsistema completo:

# NUTRITION

El propósito no es simplemente contar calorías.

El verdadero problema que queremos resolver es:

> Permitir que dos personas puedan planificar su alimentación, organizar sus comidas, cumplir sus objetivos nutricionales y generar automáticamente la lista de compras necesaria, reduciendo al mínimo la fricción mental diaria.

La aplicación debe permitir:

```text
Nutrition Strategy
        ↓
Food Library
        ↓
Recipes
        ↓
Meal Planning
        ↓
Food Logging
        ↓
Weekly / Biweekly Planning
        ↓
Grocery List
        ↓
Couple / Household
        ↓
Analytics
        ↓
Realtime
```

---

# 3. PRINCIPIO FUNDAMENTAL

Separar claramente:

## PLAN

Lo que debería comer el usuario.

## EXECUTION

Lo que realmente comió.

## ANALYTICS

Lo que ocurrió comparado con lo planificado.

## HOUSEHOLD

Lo que necesitan comprar y coordinar como pareja.

No mezclar esos conceptos en una sola tabla o entidad.

---

# 4. OBJETIVO DE PRODUCTO

La app debe ayudar a que la pareja pueda responder fácilmente:

- ¿Qué tengo que comer hoy?
- ¿Qué tengo que comer esta semana?
- ¿Cuánto debería comer?
- ¿Qué alimentos/recetas puedo utilizar?
- ¿Cuántas calorías/macros aporta?
- ¿Qué comió realmente cada uno?
- ¿Cómo vamos con nuestros objetivos?
- ¿Qué tenemos que comprar?
- ¿Qué cantidad tenemos que comprar?
- ¿Qué podemos cocinar juntos?
- ¿Qué podemos reutilizar durante la semana?
- ¿Cómo reducir el desperdicio?
- ¿Cómo reducir la cantidad de decisiones diarias?

---

# 5. PRINCIPIO DE COSTOS

Debes minimizar costos externos.

PRIORIDAD:

1. datasets open source
2. archivos estáticos
3. importación local
4. Supabase PostgreSQL
5. APIs públicas gratuitas solamente cuando realmente agreguen valor
6. APIs pagas únicamente si no existe alternativa razonable

NO introducir una API paga solamente para obtener alimentos.

El sistema debe poder funcionar completamente utilizando datasets importados a Supabase.

---

# 6. FUENTES DE DATOS DE ALIMENTOS

Investigar y documentar las siguientes fuentes antes de implementar el importer:

## Fuente primaria inicial

Repositorio:

https://github.com/brolesi/taco

Basado en TACO / POF.

Inspeccionar la estructura REAL del repositorio.

No asumir nombres de archivos ni formatos.

Determinar:

- formato
- campos
- calorías
- proteína
- carbohidratos
- grasas
- fibra
- micronutrientes
- unidades
- porciones
- medidas caseras
- identificadores
- licencia
- atribución

---

# 7. TACO / POF

Utilizarlo como fuente inicial de alimentos básicos.

Especialmente:

- carnes
- arroz
- pastas
- frutas
- verduras
- legumbres
- cereales
- lácteos
- huevos
- aceites
- frutos secos
- alimentos habituales de Latinoamérica

Importar la información a Supabase.

NO consultar GitHub en cada búsqueda de alimento durante runtime.

El runtime debe consultar Supabase.

---

# 8. FUENTE SECUNDARIA

Investigar:

## USDA FoodData Central

https://fdc.nal.usda.gov/download-datasets/

Utilizar como fuente complementaria para alimentos faltantes.

No es obligatorio importar todo USDA.

Diseñar un importer modular.

---

# 9. PRODUCTOS COMERCIALES

Investigar:

## Open Food Facts

https://world.openfoodfacts.org/

API/documentación:

https://openfoodfacts.github.io/openfoodfacts-server/api/

Utilizarla principalmente en una fase posterior para:

- productos envasados
- alimentos comerciales
- códigos de barras
- marcas

No convertir Open Food Facts en dependencia crítica del sistema.

Conservar información de licencia/atribución de cada fuente.

---

# 10. DATOS REGIONALES LATINOAMERICANOS

Investigar:

## LATINFOODS

https://www.latinfoodsportal.net/

y particularmente:

## ARGENFOODS

Evaluar su utilidad como fuente regional.

MUY IMPORTANTE:

No copiar automáticamente datos de una fuente si su licencia no permite la redistribución o modificación necesaria.

Cada dataset debe documentar:

- source
- source_id
- source_url
- license
- attribution
- imported_at

Crear una pantalla o sección de información de fuentes de datos cuando resulte apropiado.

---

# 11. FOOD DOMAIN

Crear un dominio nutricional independiente.

No guardar toda la información nutricional directamente en `recipes` o `food_logs`.

El concepto fundamental es:

```text
Food
Portion
Nutrients
Source
```

---

# 12. FOOD ENTITY

Crear una entidad `foods`.

Campos recomendados:

```text
id
external_id
name
name_es
name_en
description
category
subcategory
food_group
brand
barcode
default_unit
source
source_id
source_url
license
attribution
is_basic_food
is_packaged
metadata
created_at
updated_at
```

---

# 13. FOOD NUTRITION

Crear una forma robusta de representar composición nutricional.

Como mínimo:

```text
calories
protein
carbohydrates
fat
fiber
```

Opcionales:

```text
saturated_fat
sugar
sodium
cholesterol
```

Diseñar el modelo para permitir agregar micronutrientes posteriormente.

No sobrecomplicar la V1.

---

# 14. BASIS

Los valores nutricionales deben tener una base explícita.

Por ejemplo:

```text
per_100g
per_100ml
per_unit
```

No permitir ambigüedad.

---

# 15. FOOD PORTIONS

Crear soporte para equivalencias.

Ejemplo:

```text
1 cup
=
185 g

1 tablespoon
=
13 g

1 unit
=
120 g
```

Entidad conceptual:

```text
food_portions
```

Campos:

```text
id
food_id
label
unit
grams
ml
is_default
metadata
```

Esto es crítico para reducir la necesidad de pesar absolutamente todos los alimentos.

---

# 16. UNIDADES SOPORTADAS

Como mínimo:

```text
g
kg
mg
ml
l
unit
cup
tablespoon
teaspoon
slice
portion
piece
```

Agregar unidades adicionales cuando los datos reales lo requieran.

---

# 17. NORMALIZATION

Internamente, el sistema debe normalizar cantidades a unidades consistentes.

Ejemplo:

```text
input:
1 cup rice

normalized:
185 g
```

Luego:

```text
calories =
calories_per_100g × grams / 100
```

Lo mismo para macros y demás nutrientes.

---

# 18. NUTRITION CALCULATOR

Crear una librería independiente.

Ejemplo conceptual:

```text
calculateNutrition(food, quantity, unit)
calculateMealNutrition(items)
calculateRecipeNutrition(recipe)
calculateDailyNutrition(logs)
calculateWeeklyNutrition(logs)
```

No colocar cálculos complejos directamente dentro de componentes React.

Crear tests unitarios.

---

# 19. RECIPE DOMAIN

Crear:

```text
recipes
recipe_ingredients
```

Una receta debe tener:

```text
id
name
name_es
description
instructions
prep_time
cook_time
servings
image_url
created_by
created_at
updated_at
```

---

# 20. RECIPE INGREDIENTS

Cada ingrediente debe referenciar un `food`.

Campos:

```text
id
recipe_id
food_id
quantity
unit
normalized_grams
normalized_ml
notes
order_index
```

No almacenar solo texto libre.

---

# 21. RECIPES SHARED VS PERSONAL

Determinar soporte para:

```text
system recipe
personal recipe
household recipe
```

Los usuarios deben poder crear sus propias recetas.

Las recetas pertenecientes al hogar pueden ser compartidas entre ambos usuarios.

---

# 22. SERVINGS

Una receta debe permitir:

```text
servings = 4
```

y calcular:

```text
nutrition_per_serving
```

Sin modificar los ingredientes base.

---

# 23. MEALS

Separar:

```text
Meal
Recipe
Food
```

Una comida puede contener:

- una receta
- varios alimentos directos
- una combinación de ambos

Ejemplo:

```text
Lunch

Chicken rice bowl
+
Apple
+
Water
```

---

# 24. MEAL TYPES

Soportar como mínimo:

```text
Breakfast
Lunch
Dinner
Snack
Pre Workout
Post Workout
Other
```

Traducir según idioma.

---

# 25. MEAL PLAN

Crear planificación de comidas.

Entidades sugeridas:

```text
meal_plans
meal_plan_days
planned_meals
```

El plan debe permitir definir:

- fecha
- usuario
- meal type
- recipe
- food
- quantity
- servings
- notes
- planned calories
- planned macros

---

# 26. INDIVIDUAL MEALS

Cada usuario puede tener comidas individuales.

Ejemplo:

Facundo:

```text
Lunch
Chicken
220 g
```

María:

```text
Lunch
Chicken
160 g
```

---

# 27. SHARED MEALS

Permitir comidas compartidas.

Ejemplo:

```text
Chicken Rice Bowl

Facundo
220 g serving

María
160 g serving
```

El sistema debe calcular el total necesario para ambos.

---

# 28. COUPLE / HOUSEHOLD

La aplicación ya tiene concepto de pareja.

La documentación actual indica que el backend contempla:

```text
couples
couple_members
```

pero que la UI actualmente simplifica la relación.

En esta nueva funcionalidad NO seguir ampliando la inferencia de "el otro perfil".

Utilizar explícitamente la relación existente de pareja/household.

El concepto puede evolucionar a:

# HOUSEHOLD

El household representa el espacio compartido.

Debe poder contener:

- recetas compartidas
- comidas compartidas
- listas de compras
- elementos de compra
- eventualmente pantry/inventory

---

# 29. NUTRITION STRATEGY

La sección Strategy existente debe ampliarse.

Debe permitir configurar:

### Calories

Daily target.

### Weekly calories

Opcional.

### Protein

Daily target.

### Carbohydrates

Daily target.

### Fat

Daily target.

### Fiber

Optional target.

### Meals per day

Preferred number.

### Step goal

Mantener integración con la estrategia existente.

### Training days

Integrar con la planificación existente.

---

# 30. DAILY + WEEKLY TARGETS

No limitar el sistema a objetivos diarios.

Permitir:

```text
daily target
weekly target
```

Ejemplo:

```text
2,200 kcal/day

15,400 kcal/week
```

Pero:

NO interpretar automáticamente que el balance semanal sustituye completamente las necesidades de distribución diaria.

Es una herramienta de planificación/adherencia.

Mostrar ambos datos.

---

# 31. WEEKLY CALORIE MODEL

Permitir:

```text
Monday 2000
Tuesday 2100
Wednesday 2300
Thursday 2200
Friday 2400
Saturday 2500
Sunday 1900
```

Total:

```text
15400 kcal
```

El sistema debe poder comparar:

```text
weekly planned
weekly consumed/logged
difference
```

---

# 32. MEAL DISTRIBUTION

Permitir distribuir macros/calorías entre comidas.

Ejemplo:

```text
Breakfast 25%
Lunch 35%
Snack 15%
Dinner 25%
```

No asumir que todos los usuarios utilizan la misma distribución.

Debe ser configurable.

---

# 33. FOOD LIBRARY UI

Crear:

# FOOD LIBRARY

Debe permitir:

- buscar
- filtrar
- categorías
- favoritos
- alimentos recientes
- alimentos propios
- foods imported
- productos

Mostrar:

```text
Chicken Breast

165 kcal / 100g

31g protein
0g carbs
3.6g fat
```

---

# 34. FAVORITES

Permitir marcar alimentos favoritos.

Esto debe ser por usuario.

---

# 35. RECENT FOODS

Mostrar alimentos utilizados recientemente.

Esto reduce fricción al registrar comidas.

---

# 36. QUICK ADD

Crear:

# QUICK ADD FOOD

Flujo:

```text
Search
↓
Select food
↓
Choose quantity
↓
Choose unit
↓
Choose meal
↓
Save
```

Debe poder completarse rápidamente desde mobile.

---

# 37. FOOD LOG

Crear:

# FOOD LOG

El usuario puede registrar lo que realmente comió.

Campos:

```text
date
time
meal_type
food/recipe
quantity
unit
notes
```

---

# 38. TIME

Guardar hora real de consumo.

No guardar solamente la fecha.

Ejemplo:

```text
2026-09-01
13:14
Lunch
```

Mostrarlo correctamente según timezone.

---

# 39. FOOD LOG ITEMS

Una comida puede tener múltiples items.

Ejemplo:

```text
Lunch
13:14

Chicken 180g
Rice 200g
Olive oil 10g
Tomato 100g
```

---

# 40. AUTOMATIC NUTRITION CALCULATION

Cuando se agreguen items:

calcular automáticamente:

```text
meal calories
meal protein
meal carbs
meal fat
```

Y actualizar:

```text
daily totals
weekly totals
```

---

# 41. DAILY NUTRITION DASHBOARD

Crear:

# TODAY

Mostrar:

```text
1,820 / 2,200 kcal

Protein
151 / 180g

Carbs
198 / 220g

Fat
61 / 70g
```

Utilizar progress rings/bars coherentes con el sistema visual existente.

---

# 42. MEAL TIMELINE

Mostrar:

```text
08:00
Breakfast ✓

13:15
Lunch ✓

17:30
Snack ○

21:00
Dinner ○
```

---

# 43. PLAN VS ACTUAL

Mostrar:

```text
PLANNED
2200 kcal

LOGGED
2080 kcal

DELTA
-120 kcal
```

También para macros.

---

# 44. WEEKLY ADHERENCE

Mostrar:

```text
Weekly target
15400 kcal

Logged
15180 kcal

Difference
-220 kcal

Adherence
98.6%
```

Definir claramente cómo calcular adherencia.

Evitar métricas engañosas.

---

# 45. NUTRITION PROGRESS

Integrar Nutrition dentro de `Progress`.

Agregar gráficos:

- calories
- protein
- carbs
- fat
- meal adherence
- planned vs actual
- weekly calorie total
- average daily calories
- meal completion
- nutrition consistency

---

# 46. COUPLE NUTRITION

Dentro de `Couple` agregar:

```text
OUR NUTRITION
```

Mostrar:

```text
Facundo
Calories
Protein
Meals
Adherence

María
Calories
Protein
Meals
Adherence
```

Mantener el lenguaje motivacional.

No convertirlo en competición.

---

# 47. COUPLE SHARED MEALS

Mostrar comidas compartidas.

Ejemplo:

```text
Tonight

Chicken Rice Bowl

Facundo — 220g
María — 160g

Total chicken needed:
380g
```

---

# 48. WEEKLY MEAL PLANNER

Crear una interfaz visual de calendario.

Ejemplo:

```text
Monday
Breakfast
Lunch
Snack
Dinner

Tuesday
Breakfast
Lunch
Snack
Dinner
...
```

Mobile:

scroll vertical.

Desktop:

grid semanal.

---

# 49. MEAL PLANNER INTERACTION

Permitir:

- agregar comida
- cambiar receta
- duplicar
- mover
- eliminar
- editar cantidad
- cambiar día
- cambiar horario

Utilizar drag & drop cuando tenga sentido.

---

# 50. FLEXIBLE MEALS

Una comida no tiene que estar siempre completamente definida.

Permitir:

```text
Flexible meal
~500 kcal
```

Esto deja espacio para decisiones espontáneas.

---

# 51. MEAL TEMPLATES

Crear plantillas como:

```text
High Protein Breakfast
Quick Lunch
Light Dinner
Pre Workout
Post Workout
Snack
```

Permitir duplicarlas.

---

# 52. RECIPES UI

Crear:

# RECIPES

Cada receta debe mostrar:

- foto
- nombre
- servings
- calories
- protein
- carbs
- fat
- ingredients
- instructions

Permitir:

- crear
- editar
- duplicar
- eliminar
- favorite
- compartir con household

---

# 53. AUTOMATIC RECIPE NUTRITION

Nunca pedir al usuario que escriba manualmente las calorías de una receta cuando todos sus ingredientes estén disponibles.

Calcularlas desde:

```text
ingredient nutrition
× quantity
÷ servings
```

---

# 54. GROCERY LIST

Crear:

# GROCERY LIST

Debe pertenecer al household.

No a un usuario individual.

---

# 55. GROCERY GENERATION

El usuario debe poder seleccionar:

```text
Generate grocery list
```

para:

```text
7 days
14 days
28 days
```

El sistema debe:

1. cargar comidas planificadas
2. cargar recetas
3. cargar ingredientes
4. resolver foods
5. normalizar unidades
6. sumar cantidades
7. agrupar ingredientes equivalentes
8. redondear cantidades de compra
9. crear lista

---

# 56. SHOPPING AGGREGATION

Ejemplo:

Monday:
150g chicken

Tuesday:
200g chicken

Wednesday:
150g chicken

Friday:
200g chicken

Total:

700g

Mostrar:

```text
Chicken
Calculated: 700g
Suggested purchase: 1kg
```

---

# 57. INTELLIGENT ROUNDING

Nunca obligar al usuario a comprar cantidades absurdas.

Ejemplo:

```text
1.73kg chicken
```

convertir visualmente a:

```text
2kg
```

Conservar internamente el valor calculado.

---

# 58. PURCHASE UNITS

La lista de compras debería permitir mostrar:

- grams
- kilograms
- liters
- bottles
- packs
- units
- dozens

dependiendo del alimento.

---

# 59. GROCERY CATEGORIES

Agrupar automáticamente por:

```text
Produce
Protein
Dairy
Grains
Pantry
Frozen
Beverages
Snacks
Other
```

Traducir.

---

# 60. GROCERY ITEM STATUS

Cada item debe tener:

```text
pending
purchased
```

Permitir marcarlo.

---

# 61. LIVE GROCERY SYNC

Supabase Realtime.

Si María marca:

```text
Chicken ✓
```

Facundo debe verlo inmediatamente.

No refresh manual.

---

# 62. WEEKLY / BIWEEKLY / MONTHLY

La lista de compras debe poder generarse en distintos horizontes.

### Weekly

7 días.

### Biweekly

14 días.

### Monthly

28–31 días.

Pero para alimentos perecederos:

preferir generar listas separadas por semana.

Ejemplo:

```text
September

Week 1
Week 2
Week 3
Week 4
```

---

# 63. PANTRY — PREPARE BUT DON'T OVERBUILD

Diseñar la arquitectura para soportar posteriormente:

# PANTRY

Ejemplo:

```text
Rice
1.2 kg available

Required
2 kg

Buy
800g
```

Para V1:

- dejar modelo preparado
- no construir un sistema enorme de inventario

---

# 64. INGREDIENT REUSE

El planificador debe priorizar recetas que reutilicen ingredientes.

Ejemplo:

Recipe A:
Chicken + rice + tomato

Recipe B:
Chicken + rice + onion

Recipe C:
Chicken + rice + broccoli

Es preferible a utilizar 15 ingredientes completamente distintos.

Crear, si resulta razonable, una métrica:

```text
ingredientReuseScore
```

para el futuro auto-planner.

---

# 65. FOOD WASTE

Preparar soporte para minimizar desperdicio.

No es necesario implementar predicción avanzada en V1.

Pero conservar información suficiente para saber:

- qué se compra
- qué se necesita
- qué recetas lo utilizan

---

# 66. AUTO PLAN — ARQUITECTURA PREPARADA

No es obligatorio implementar un generador automático completo en la primera versión.

Pero la arquitectura debe quedar preparada para:

# AUTO PLAN WEEK

Inputs futuros:

```text
Calories
Protein
Meals/day
Preferred foods
Excluded foods
Budget
Cooking days
```

El motor debería eventualmente:

1. seleccionar recetas
2. ajustar porciones
3. cumplir aproximadamente objetivos
4. maximizar reutilización
5. minimizar variedad innecesaria
6. minimizar desperdicio
7. respetar preferencias

NO utilizar IA para esto inicialmente.

Priorizar un motor determinístico.

---

# 67. BUDGET — OPTIONAL FOUNDATION

Preparar campos opcionales:

```text
estimated_price
price_unit
currency
```

para alimentos/productos.

No integrar APIs de supermercado.

Permitir eventualmente carga manual.

---

# 68. HOUSEHOLD SHARED PLANNING

Debe existir una vista:

# OUR WEEK

que combine:

- entrenamiento de ambos
- comidas de ambos
- comidas compartidas
- lista de compras
- metas

Esto podría convertirse en una de las pantallas principales del producto.

---

# 69. INTEGRATION WITH TRAINING

Nutrition debe integrarse con Workout.

Ejemplo:

Si el usuario tiene entrenamiento:

```text
Monday
18:00
Legs
```

poder marcar una comida:

```text
Pre Workout
17:00
```

y:

```text
Post Workout
20:00
```

No crear todavía recomendaciones médicas.

Solo permitir planificación temporal.

---

# 70. LIVE TRAINING + NUTRITION

No es necesario modificar la mecánica de Live Training.

Pero si el usuario tiene una comida planificada alrededor del entrenamiento:

mostrar opcionalmente:

```text
Pre-workout meal planned
```

---

# 71. NOTIFICATIONS — FOUNDATION ONLY

No implementar push notifications.

Pero crear eventos internos que eventualmente permitan:

```text
Meal planned
Meal logged
Grocery list generated
Shopping completed
```

---

# 72. ACTIVITY EVENTS

Extender `activity_events`.

Nuevos eventos:

```text
meal_logged
meal_completed
nutrition_goal_reached
recipe_created
grocery_item_purchased
grocery_list_generated
```

No crear eventos innecesarios.

---

# 73. REALTIME

La nueva funcionalidad debe utilizar Supabase Realtime.

Evaluar como mínimo:

```text
meal_plans
planned_meals
food_logs
recipes
grocery_lists
grocery_list_items
nutrition metrics
activity_events
```

No asumir que todas las tablas deben publicarse.

Elegir las que realmente requieren sincronización.

---

# 74. REALTIME REQUIREMENT

La experiencia esperada:

María está viendo Grocery List.

Facundo marca:

```text
Eggs ✓
```

María recibe el cambio automáticamente.

---

# 75. REALTIME STRATEGY

No simplemente ejecutar un `refreshFromRemote()` gigantesco ante cada cambio.

La documentación actual identifica que ese patrón ya existe y puede resultar costoso.

Para esta nueva funcionalidad:

preferir:

```text
event
↓
identify affected entity
↓
update local cache/state
```

Cuando sea seguro.

Si se necesita fallback a refetch:

hacerlo selectivamente.

---

# 76. FIX EXISTING REALTIME WEAKNESSES

Antes o durante esta funcionalidad, corregir los problemas relevantes ya identificados:

- indicador de Realtime demasiado simplificado
- refresh completo
- tablas de Strategy no suscritas
- duplicación de eventos
- duplicación de PR logic
- falta de merge granular

La nueva arquitectura no debe reproducir estos problemas.

---

# 77. ERROR HANDLING

No utilizar exclusivamente:

```text
console.warn()
```

para errores de persistencia.

La UI debe poder saber:

```text
saving
saved
failed
retrying
offline
```

---

# 78. OPTIMISTIC UPDATES

Permitir optimistic UI donde sea apropiado.

Ejemplo:

Usuario marca:

```text
Chicken ✓
```

La UI cambia inmediatamente.

Luego persiste.

Si falla:

rollback.

---

# 79. OFFLINE FOUNDATION

No es obligatorio implementar un sistema offline completo.

Pero evitar perder datos si falla momentáneamente la conexión.

Priorizar una estructura que en el futuro pueda tener:

```text
outbox
retry queue
```

---

# 80. DATABASE MIGRATION

Crear nuevas migraciones SQL.

NO editar destructivamente migraciones antiguas ya existentes.

Crear nuevas migraciones versionadas.

Ejemplo conceptual:

```text
20260901000000_nutrition_foundation.sql
20260901001000_nutrition_meals.sql
20260901002000_nutrition_groceries.sql
```

Los nombres finales dependen del proyecto.

---

# 81. DATABASE TABLES

Como mínimo evaluar:

```text
foods
food_portions
food_sources
food_favorites

recipes
recipe_ingredients

meal_plans
meal_plan_days
planned_meals

food_logs
food_log_items

grocery_lists
grocery_list_items
```

No crear tablas si una relación existente puede resolver correctamente el problema.

---

# 82. RLS

Implementar RLS rigurosamente.

Reglas generales:

### Foods

Usuarios autenticados pueden leer.

Solo procesos autorizados pueden modificar catálogo global.

### Favorites

Solo propietario.

### Recipes

Privadas o compartidas según `visibility`.

### Meals

Solo propietario.

### Food logs

Solo propietario.

### Grocery lists

Household members.

### Grocery items

Household members.

---

# 83. HOUSEHOLD RLS

No inferir:

> "el usuario distinto es la pareja"

Utilizar explícitamente `couple_members`.

Esto coincide con la recomendación técnica existente de dejar de inferir la pareja desde el array de perfiles.

---

# 84. EXACTLY TWO USERS

El producto continúa diseñado para dos usuarios.

Si resulta sencillo y seguro, fortalecer la validación de que el household tenga exactamente dos miembros.

No romper compatibilidad con el modelo existente.

---

# 85. FOOD IMPORTER

Crear un importer reproducible.

Ejemplo:

```bash
yarn seed:foods
```

o:

```bash
yarn import:foods
```

Debe:

1. descargar/leer fuente
2. validar estructura
3. normalizar
4. mapear categorías
5. insertar alimentos
6. insertar nutrientes
7. insertar medidas
8. guardar metadata de fuente
9. evitar duplicados
10. mostrar estadísticas

---

# 86. IMPORT REPORT

Mostrar:

```text
Imported: 597
Updated: 32
Skipped: 4
Invalid: 0
Failed: 0
```

---

# 87. IMPORT VALIDATION

El importer debe detectar:

- nombres faltantes
- nutrientes inválidos
- unidades inválidas
- cantidades negativas
- ids duplicados
- alimentos duplicados

No insertar datos obviamente corruptos.

---

# 88. DATA DEDUPLICATION

Definir estrategia.

Prioridad:

```text
source + source_id
```

y cuando sea necesario:

```text
normalized name + source
```

No hacer matching difuso destructivo automáticamente.

---

# 89. FOOD SEARCH

Crear índice adecuado.

La DB actual ya utiliza búsqueda full-text para ejercicios; utilizar un enfoque equivalente para alimentos cuando tenga sentido.

Permitir:

```text
"pollo"
"chicken"
"pechuga"
```

Dependiendo de idioma/aliases.

---

# 90. FOOD ALIASES

Crear soporte para aliases.

Ejemplo:

```text
chicken breast
pechuga de pollo
pollo pechuga
```

Esto mejorará muchísimo la búsqueda.

---

# 91. TRANSLATIONS

Toda la UI debe continuar soportando:

- Español
- English

No hardcodear textos.

Agregar claves de traducción para todo Nutrition.

---

# 92. NUTRITION I18N

Traducir:

- nombres UI
- categorías
- meal types
- botones
- errores
- unidades cuando corresponda
- estados
- mensajes
- grocery categories
- planner
- recetas
- Food Log

Los datos originales de los datasets NO tienen que traducirse artificialmente si no existe traducción confiable.

Utilizar `name_es` / `name_en` cuando existan.

---

# 93. UX PRINCIPLE

Nutrition debe requerir pocos taps.

Ejemplo:

```text
Add food
↓
Search
↓
Chicken
↓
180g
↓
Lunch
↓
Save
```

No crear formularios gigantes.

---

# 94. MOBILE UX

Diseñar mobile first.

Especialmente:

- Food Log
- Meal Planner
- Grocery List
- Quick Add
- Recipe creation

---

# 95. GROCERY MOBILE UX

Una lista de supermercado debe poder utilizarse con una mano.

Cada item:

```text
☐ Chicken
☐ Rice
☐ Eggs
☑ Milk
```

Touch targets grandes.

---

# 96. LIVE SYNC FEEDBACK

Mostrar indicador discreto:

```text
Synced
Saving...
Offline
```

No bloquear la pantalla.

---

# 97. VISUAL DESIGN

Mantener exactamente la identidad visual actual:

- dark only
- glassmorphism
- purple
- neon
- premium
- futuristic
- subtle glow

No crear un segundo lenguaje visual para Nutrition.

---

# 98. NUTRITION UI

Crear componentes reutilizables:

```text
NutritionCard
MacroRing
MacroBar
FoodCard
FoodSearch
FoodPicker
FoodPortionSelector
MealCard
MealTimeline
RecipeCard
RecipeEditor
IngredientRow
MealPlanner
WeeklyPlanner
FoodLog
NutritionSummary
GroceryList
GroceryItem
GroceryCategory
HouseholdMealCard
NutritionProgressChart
```

---

# 99. ANIMATIONS

Utilizar Framer Motion.

Animar:

- adicionar alimento
- completar comida
- actualizar macros
- marcar compra
- mover comidas
- abrir receta
- cambiar semana
- generar grocery list
- progress bars

Sin exagerar.

---

# 100. NUTRITION DASHBOARD

La pantalla debe tener:

```text
Today's Calories

Macro Breakdown

Today's Meals

Next Meal

Weekly Progress

Quick Add

Grocery Status
```

---

# 101. WEEK VIEW

Crear selector:

```text
Today
This week
Next week
```

Opcional:

```text
2 weeks
Month
```

---

# 102. MEAL PLAN VERSUS FOOD LOG

Nunca mezclar los dos.

Plan:

```text
planned_meals
```

Real:

```text
food_logs
food_log_items
```

Analytics compara ambos.

---

# 103. MEAL COMPLETION

Permitir marcar una comida planificada como realizada.

Pero distinguir:

```text
planned
completed
logged
```

No asumir que "completed" significa nutricionalmente exacto.

---

# 104. QUANTITY VARIANCE

Si estaba planificado:

```text
200g chicken
```

y el usuario registra:

```text
160g
```

guardar ambos.

Mostrar:

```text
planned: 200g
actual: 160g
```

Esto alimentará analytics.

---

# 105. WEEKLY CALORIE BALANCE

Calcular:

```text
planned weekly calories
actual/logged weekly calories
difference
```

También macros.

Mostrar tendencias, no solamente valores aislados.

---

# 106. RECIPES + GROCERY

Cuando una receta tenga ingredientes:

```text
Chicken 400g
Rice 300g
Tomato 200g
```

y se utilice 3 veces:

calcular necesidades totales.

---

# 107. SHARED RECIPES

Permitir:

```text
Private
Household
```

Una receta household puede utilizarse en los planes de ambos.

---

# 108. GROCERY LIST PERSISTENCE

Una grocery list generada NO debe ser solo una vista calculada.

Debe poder:

- guardarse
- modificarse
- marcar items
- agregar manualmente items
- eliminar items
- regenerarse
- duplicarse

---

# 109. REGENERATE LIST

Si se modifica el meal plan:

mostrar:

```text
Meal plan changed.

Update grocery list?
```

El usuario puede actualizarla.

No destruir arbitrariamente modificaciones manuales.

---

# 110. MANUAL GROCERY ITEMS

Permitir:

```text
+ Add item
```

Ejemplo:

```text
Dog food
Toilet paper
Water
```

aunque no provengan del plan nutricional.

Esto convierte la grocery list en una auténtica lista del hogar.

---

# 111. SOURCE OF GROCERY ITEM

Distinguir:

```text
planned
manual
```

y opcionalmente:

```text
recipe-derived
```

---

# 112. GROCERY LIST HISTORY

Mantener listas anteriores.

Ejemplo:

```text
Aug 24–30
Completed

Aug 31–Sep 6
Current

Sep 7–13
Planned
```

---

# 113. MONTHLY OVERVIEW

Crear una vista mensual opcional:

```text
September

Week 1
Week 2
Week 3
Week 4
```

Mostrar:

- comidas planificadas
- grocery lists
- adherencia
- gastos si posteriormente existe presupuesto

---

# 114. DATA ATTRIBUTION

No olvidar la fuente de los alimentos.

Crear documentación:

```text
FOOD DATA SOURCES
```

y guardar metadata de cada alimento.

No eliminar la trazabilidad.

---

# 115. LICENSE COMPLIANCE

Antes de importar cualquier dataset:

- leer su licencia
- registrar license
- registrar attribution
- verificar que la forma de distribución de Train Together sea compatible

NO asumir que "está en GitHub" significa "puedo usarlo de cualquier forma".

Si existe una incompatibilidad clara:

no importar automáticamente la fuente.

Documentar la alternativa.

---

# 116. TYPES

Extender:

```text
src/types/index.ts
src/types/database.ts
```

Mantener snake_case ↔ camelCase mapping donde corresponda.

---

# 117. SUPABASE GENERATED TYPES

La documentación actual indica que los tipos Supabase son manuales.

En esta nueva fase:

preferir generar tipos oficiales con Supabase.

Configurar un script equivalente a:

```bash
yarn db:types
```

que genere los tipos.

Utilizar:

```ts
SupabaseClient<Database>
```

cuando sea viable.

---

# 118. REPOSITORY LAYER

Extender `repository.ts`.

No disparar consultas Supabase directamente desde componentes cuando sea evitable.

Crear funciones específicas:

```text
loadFoods()
searchFoods()
saveFoodFavorite()
saveRecipe()
saveMealPlan()
saveFoodLog()
generateGroceryList()
saveGroceryList()
```

etc.

---

# 119. DOMAIN SERVICES

Separar lógica compleja:

```text
src/lib/nutrition.ts
src/lib/mealPlanner.ts
src/lib/grocery.ts
```

o una estructura de features equivalente.

No poner toda la lógica en `FitnessContext`.

---

# 120. STATE MANAGEMENT

Extender el estado actual de manera prudente.

No convertir `FitnessContext` en un monstruo.

Si el dominio nutricional crece demasiado:

crear un contexto/hook separado:

```text
NutritionContext
```

o una solución equivalente.

Mantener separación entre:

```text
fitness state
nutrition state
household state
```

---

# 121. CACHING

Los alimentos de catálogo son relativamente estáticos.

No refetcharlos innecesariamente.

Utilizar:

- cache
- memoization
- stale time
- local persistence opcional para catálogo

si la arquitectura lo permite.

---

# 122. PERFORMANCE

Food Library podría contener cientos o miles de registros.

No renderizar miles de cards de golpe.

Utilizar:

- búsqueda
- paginación
- virtualization cuando sea necesario
- limit
- indexed search

---

# 123. FOOD SEARCH PERFORMANCE

El usuario debe poder escribir:

```text
pollo
```

y obtener resultados rápidamente.

No descargar toda la tabla al cliente si el dataset crece significativamente.

Preferir búsqueda en PostgreSQL.

---

# 124. ANALYTICS

Agregar cálculos:

```text
daily calories
weekly calories
macro adherence
meal adherence
planned vs actual
```

---

# 125. COUPLE ANALYTICS

Comparar:

```text
Facundo weekly adherence
María weekly adherence
```

y mostrarlo de manera motivacional.

Nunca presentar:

```text
winner / loser
```

---

# 126. DASHBOARD INTEGRATION

Añadir al dashboard general:

```text
Nutrition today
Next meal
Calories remaining
Grocery status
```

Sin hacer la pantalla excesivamente pesada.

---

# 127. CROSS-DOMAIN EXPERIENCE

La aplicación completa deberá sentirse como:

```text
Training
+
Nutrition
+
Planning
+
Household
```

No como productos separados.

---

# 128. FUTURE EXTENSIBILITY

Dejar arquitectura preparada para:

- barcode scanning
- Open Food Facts
- pantry
- grocery budgeting
- meal generation
- nutrition recommendations
- recurring meal plans
- shopping history
- price tracking
- food substitutions
- allergies/preferences
- exclusion lists

NO implementar todo ahora.

---

# 129. FUTURE PREFERENCES

Preparar eventualmente:

```text
favorite foods
disliked foods
dietary restrictions
allergens
preferences
```

No introducir recomendaciones médicas.

---

# 130. MEDICAL/HEALTH BOUNDARY

La aplicación es una herramienta de planificación y seguimiento.

No presentar:

- diagnósticos
- prescripciones médicas
- afirmaciones clínicas
- recomendaciones médicas personalizadas

Las calorías/macros son objetivos introducidos por los usuarios.

---

# 131. TESTING

Agregar tests unitarios para:

### Nutrition

- nutrition calculation
- portion conversion
- recipe calculation
- serving calculation
- meal calculation

### Planner

- weekly calorie totals
- planned vs actual
- adherence

### Grocery

- ingredient aggregation
- units
- rounding
- duplicated ingredients
- shared meals

### Live data

- date handling
- timezone

---

# 132. DATABASE TESTING

Agregar verificación para:

- RLS
- household access
- recipe access
- food log access
- grocery access
- Realtime publication

---

# 133. E2E

Agregar E2E cuando sea viable.

Casos críticos:

```text
Login
↓
Create recipe
↓
Plan meal
↓
Log meal
↓
Generate grocery list
↓
Second user sees grocery list
↓
Second user checks item
↓
First user receives realtime update
```

---

# 134. DB CHECK

Extender:

```bash
yarn db:check
```

para validar:

- nutrition tables
- food records
- food portions
- household recipes
- meals
- food logs
- grocery lists
- Realtime
- RLS

---

# 135. SEED

Crear datos demo nutricionales realistas.

Incluir:

- alimentos
- recetas
- planes
- comidas
- logs
- grocery list

Los datos demo deben existir solamente para demostración/desarrollo.

---

# 136. SAMPLE DATA

Ejemplo:

```text
Breakfast
Overnight Oats

Lunch
Chicken Rice Bowl

Snack
Greek Yogurt + Banana

Dinner
Beef + Potatoes
```

Crear suficientes datos históricos para que los gráficos funcionen.

---

# 137. USER EXPERIENCE

El objetivo no es maximizar cantidad de campos.

El objetivo es:

# MINIMUM FRICTION

El usuario debe poder:

- consultar
- registrar
- planificar
- comprar

con pocos pasos.

---

# 138. "I DON'T WANT TO COUNT EVERYTHING"

Diseñar el sistema para permitir:

### exact mode

```text
180g
```

y:

### portion mode

```text
1 serving
1 cup
1 piece
```

Esto permite distintos niveles de precisión.

---

# 139. PRECISION LEVEL

Guardar opcionalmente:

```text
precision:
exact
estimated
portion
```

Esto permite saber si un dato fue exacto o aproximado.

---

# 140. ESTIMATED NUTRITION

Cuando una cantidad utilice una medida casera:

mostrar visualmente:

```text
Estimated
```

No presentar una estimación como precisión absoluta.

---

# 141. FOOD LOG SPEED

Implementar:

### Recent

### Favorites

### Search

### Quick Add

para acelerar el registro diario.

---

# 142. MEAL DUPLICATION

Permitir:

```text
Repeat yesterday's breakfast
```

o:

```text
Copy meal to another day
```

Esta funcionalidad tendrá mucho valor práctico.

---

# 143. WEEK DUPLICATION

Permitir eventualmente:

```text
Copy previous week
```

para meal plans.

Esto reduce muchísimo la carga administrativa.

---

# 144. RECURRING MEALS

Preparar soporte para:

```text
Every Monday breakfast
Every weekday lunch
```

No necesariamente implementar recurrencias complejas en la V1 si complican demasiado el modelo.

---

# 145. USER FLOW

## Primer acceso

```text
Login
↓
Dashboard
↓
Nutrition
↓
Set nutrition strategy
↓
Browse foods / create recipes
↓
Create meal plan
↓
Generate grocery list
```

---

# 146. DAILY FLOW

```text
Open app
↓
See today's nutrition
↓
See next meal
↓
Log food
↓
Macros update
↓
Progress updates
↓
Partner sees relevant shared activity
```

---

# 147. WEEKLY FLOW

```text
Plan week
↓
Choose meals
↓
Adjust portions
↓
Generate grocery list
↓
Go shopping
↓
Check items
↓
Cook
↓
Log meals
↓
Review weekly adherence
```

---

# 148. COUPLE FLOW

```text
Facundo changes meal
↓
Supabase
↓
Realtime
↓
María sees update

María marks grocery item
↓
Supabase
↓
Realtime
↓
Facundo sees update
```

---

# 149. NAVIGATION

Agregar Nutrition a la navegación existente.

Ejemplo mobile:

```text
Home
Workout
Nutrition
Progress
Couple
```

Si el espacio resulta demasiado grande, utilizar una navegación secundaria dentro de Nutrition.

Desktop:

sidebar.

---

# 150. NUTRITION SUBNAV

Dentro de Nutrition:

```text
Overview
Strategy
Meals
Recipes
Foods
Grocery
Log
```

Usar una estructura clara.

---

# 151. ACCESSIBILITY

Mantener:

- keyboard navigation
- focus states
- aria labels
- contrast
- semantic elements
- reduced motion

---

# 152. RESPONSIVENESS

Testear como mínimo:

```text
360
390
430
768
1024
1280
1440+
```

---

# 153. VISUAL QUALITY

No aceptar:

- overflow horizontal
- cards rotas
- gráficos cortados
- inputs microscópicos
- modales imposibles de cerrar
- listas que no permiten scrolling correcto

---

# 154. README

Actualizar README.

Documentar:

- nutrition architecture
- food datasets
- licenses
- import process
- migration process
- new environment variables
- seeds
- commands
- realtime
- RLS

---

# 155. COMMANDS

Mantener Yarn.

Agregar scripts:

```bash
yarn seed:foods
yarn db:types
yarn db:check
yarn test
yarn lint
yarn typecheck
yarn build
```

Utilizar los nombres que mejor encajen con el proyecto.

---

# 156. NO NPM

No generar instrucciones como:

```bash
npm install
npm run dev
```

Utilizar Yarn.

---

# 157. ENVIRONMENT

No exponer:

```text
SUPABASE_SERVICE_ROLE_KEY
```

en frontend.

Solo scripts administrativos.

---

# 158. MIGRATION SAFETY

Nunca borrar datos existentes de usuarios durante migraciones.

Usar:

```text
ALTER
CREATE
ADD
```

con precaución.

---

# 159. BACKWARD COMPATIBILITY

Las funcionalidades actuales deben seguir funcionando:

- login
- dashboard
- workout
- live training
- manual training
- history
- progress
- couple
- exercises
- profile

La nueva implementación no debe romperlas.

---

# 160. IMPORTANT EXISTING ISSUES

La documentación técnica actual ya identifica problemas como:

- Realtime parcial
- refresh completo
- eventos duplicados
- PR logic duplicada
- strategy versioning incompleto
- pareja inferida desde perfiles
- media externa
- persistencia fire-and-forget
- tipos Supabase manuales



Al ampliar la arquitectura:

corregir los problemas que interfieran directamente con Nutrition/Household/Realtime.

No introducir deuda técnica innecesaria.

---

# 161. SINGLE SOURCE OF TRUTH

Definir una fuente de verdad clara.

Para Nutrition:

```text
foods
recipes
meal plans
food logs
grocery lists
```

No duplicar cálculos sin necesidad.

---

# 162. NUTRITION CALCULATION SOURCE

Los valores nutricionales deben venir de:

```text
Food
↓
Quantity
↓
Normalization
↓
Calculator
```

Nunca de valores manuales ocultos en UI.

---

# 163. GROCERY SOURCE OF TRUTH

La lista calculada debe poder rastrear:

```text
grocery item
← planned meal
← recipe
← ingredient
← food
```

Guardar metadata/references cuando sea útil.

---

# 164. MANUAL CHANGES

Si el usuario modifica manualmente una cantidad en grocery list:

no perderla automáticamente al regenerar.

Diseñar un mecanismo:

```text
calculated quantity
manual adjustment
final quantity
```

si resulta necesario.

---

# 165. SHOPPING COMPLETION

Permitir marcar:

```text
Purchased
```

y recordar el estado.

---

# 166. GROCERY HISTORY

Guardar las listas para poder consultar posteriormente.

---

# 167. ANALYTICS FROM FOOD LOG

No calcular estadísticas a partir del meal plan.

Para consumo real:

usar `food_logs`.

Para adherencia:

comparar con `meal_plans`.

---

# 168. DATE MODEL

Nutrition depende mucho más de fecha/hora que otras áreas.

Utilizar de forma consistente:

```text
date
timestamp
timezone
```

Los datos diarios deben usar la fecha local del usuario.

---

# 169. MEAL TIMING

Permitir horarios opcionales.

Por ejemplo:

```text
Lunch
13:30
```

No obligar a introducir horarios cuando no sean necesarios.

---

# 170. DATA QUALITY

No permitir:

- cantidades negativas
- kcal negativas
- macros negativas
- gramos negativos
- servings 0
- objetivos imposibles

Agregar constraints donde corresponda.

---

# 171. DATABASE INDEXES

Crear índices para:

- food search
- food source
- recipe owner
- recipe household
- meal plan date
- food logs date
- grocery list household
- grocery items status

---

# 172. TRANSACTIONS

Cuando se genere una grocery list:

si deben crearse muchas filas:

utilizar una transacción o estrategia consistente para evitar listas parcialmente creadas.

---

# 173. RACE CONDITIONS

Considerar especialmente:

- dos usuarios modificando la misma grocery list
- ambos marcando items
- regeneración simultánea
- edición de shared recipes

Realtime no sustituye control de concurrencia.

---

# 174. CONFLICT STRATEGY

No implementar CRDT complejo.

Una estrategia razonable:

- timestamps
- updated_at
- optimistic update
- server confirmation
- reload affected entity on conflict

---

# 175. EMPTY STATES

Crear mensajes útiles:

```text
No meals planned yet.
Create your first meal.
```

```text
Your grocery list is empty.
Generate one from this week's plan.
```

etc.

Traducidos.

---

# 176. ONBOARDING

No hacer obligatorio un onboarding nutricional largo.

Puede existir una configuración inicial opcional.

---

# 177. FIRST NUTRITION SETUP

Permitir:

```text
Calories
Protein
Carbs
Fat
Meals/day
```

Guardar.

Luego ofrecer:

```text
Plan your first week
```

---

# 178. FAVORITES + RECENTS

Food search debe utilizar ambos.

---

# 179. PERFORMANCE OF RECIPE NUTRITION

No recalcular toda una receta cada vez que aparece en una lista.

Memoizar/cachar cuando sea razonable.

Invalidar cuando cambie un ingrediente.

---

# 180. PROGRESS CHARTS

Usar Recharts como el resto de la aplicación.

Animar.

Respetar dark theme.

Responsive.

---

# 181. FOOD DATA ATTRIBUTION UI

Agregar una pequeña referencia:

```text
Data source: TACO
```

cuando corresponda.

No ensuciar cada card.

Puede ir en detalle.

---

# 182. SOURCE DETAIL

Dentro de Food Detail:

```text
Source
TACO / POF

Source ID
1234

License
...

Original source
...
```

---

# 183. API ABSTRACTION

No acoplar el dominio a TACO.

Crear interfaz conceptual:

```text
FoodProvider
```

o equivalente.

Esto permitirá posteriormente:

```text
TACOProvider
USDAProvider
OpenFoodFactsProvider
```

---

# 184. IMPORTED DATA VS EXTERNAL DATA

Distinguir:

```text
imported
external
```

La aplicación preferirá datos locales/importados para runtime.

---

# 185. NO PAID SERVICES

No incorporar:

- paid nutrition APIs
- paid AI APIs
- paid grocery APIs
- paid barcode APIs

sin una necesidad futura explícita.

---

# 186. FUTURE AI

El sistema puede quedar preparado para que una IA posteriormente sugiera:

- recetas
- meal plans
- substitutions

Pero NO construir esa capa ahora.

---

# 187. FINAL ARCHITECTURE

La aplicación debería evolucionar hacia:

```text
TRAIN TOGETHER
│
├── TRAINING
│   ├── Strategy
│   ├── Manual Training
│   ├── Live Training
│   └── Progress
│
├── NUTRITION
│   ├── Strategy
│   ├── Foods
│   ├── Recipes
│   ├── Meals
│   ├── Food Log
│   ├── Meal Planner
│   └── Nutrition Progress
│
└── HOUSEHOLD
    ├── Couple Progress
    ├── Shared Meals
    ├── Grocery Lists
    └── Activity
```

Backend:

```text
Supabase
│
├── Auth
├── PostgreSQL
├── RLS
├── Realtime
└── Storage
```

---

# 188. IMPLEMENTATION ORDER

No implementar todas las features simultáneamente sin estructura.

Trabajar en este orden:

## PHASE 1 — RESEARCH & DATA

- inspect datasets
- inspect licenses
- determine schemas
- create importer
- import initial catalog

## PHASE 2 — FOOD DOMAIN

- foods
- portions
- nutrients
- search
- favorites
- nutrition calculator

## PHASE 3 — RECIPES

- recipes
- ingredients
- servings
- nutrition calculation

## PHASE 4 — FOOD LOG

- meals
- logging
- daily totals
- nutrition dashboard

## PHASE 5 — MEAL PLANNER

- week planner
- individual meals
- shared meals
- planned vs actual

## PHASE 6 — GROCERY

- grocery list
- aggregation
- rounding
- household
- realtime

## PHASE 7 — ANALYTICS

- weekly totals
- adherence
- graphs
- couple analytics

## PHASE 8 — HARDENING

- RLS
- realtime
- tests
- performance
- type generation
- error handling
- documentation

---

# 189. AGENT WORK ALLOCATION

Si el entorno soporta múltiples agentes, dividir el trabajo aproximadamente en:

### Agent A — Research/Data

Responsable:

- dataset research
- license verification
- schema mapping
- food importer

### Agent B — Database/Supabase

Responsable:

- migrations
- tables
- constraints
- indexes
- RLS
- Realtime
- triggers/functions

### Agent C — Nutrition Domain

Responsable:

- types
- nutrition calculations
- food services
- recipes
- meal logic

### Agent D — UX/UI

Responsable:

- Nutrition screens
- Food Library
- Recipes
- Meal Planner
- Food Log
- Grocery List

### Agent E — Realtime/Integration

Responsable:

- repository
- state
- realtime
- optimistic updates
- household synchronization

### Agent F — QA

Responsable:

- unit tests
- DB checks
- edge cases
- responsive validation
- regression testing

Los agentes deben comunicarse mediante archivos/documentación compartida y respetar interfaces/tipos antes de realizar cambios incompatibles.

---

# 190. AGENT RULE

No cambiar una API interna o modelo de datos utilizado por otro agente sin documentar el cambio.

Preferir:

```text
types first
contracts second
implementation third
```

---

# 191. DATABASE FIRST

Antes de construir UI compleja:

finalizar primero:

- schema
- migration
- RLS
- types
- seed

Luego construir el frontend sobre datos reales.

---

# 192. DATASET FIRST

No construir Food Library suponiendo campos que después no existen.

Primero inspeccionar el dataset real.

---

# 193. NO FAKE DATA

Los componentes deben consumir datos reales.

El seed puede aportar demo data.

No hardcodear estadísticas.

---

# 194. NO PLACEHOLDER FUNCTIONALITY

No dejar:

```text
TODO
coming soon
implement later
```

para funcionalidades que forman parte del alcance principal.

---

# 195. CODE QUALITY

Mantener:

- TypeScript estricto
- componentes pequeños
- funciones puras donde sea posible
- separación de dominio/UI
- nombres descriptivos
- evitar `any`
- evitar duplicación

---

# 196. BUILD VALIDATION

Antes de terminar:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

Todos deben pasar.

---

# 197. DATABASE VALIDATION

Ejecutar:

```bash
yarn db:check
```

Debe confirmar:

- tablas
- datos
- RLS
- Realtime
- usuarios
- household
- food catalog

---

# 198. REGRESSION TEST

Verificar que sigan funcionando:

```text
Login
Dashboard
Strategy
Manual Training
Live Training
History
Progress
Couple
Exercise Library
Profile
```

---

# 199. NUTRITION E2E FINAL

Verificar:

```text
Login
↓
Nutrition Strategy
↓
Create recipe
↓
Plan meal
↓
Log meal
↓
Nutrition dashboard updates
↓
Generate grocery list
↓
Partner sees list
↓
Partner checks item
↓
Realtime update
↓
Progress updates
```

---

# 200. FINAL PRODUCT CRITERIA

La funcionalidad se considera terminada únicamente cuando:

- el catálogo de alimentos funciona
- los alimentos tienen trazabilidad
- las porciones funcionan
- los cálculos funcionan
- las recetas funcionan
- las comidas funcionan
- el food log funciona
- la estrategia nutricional funciona
- el meal planner funciona
- el grocery planner funciona
- household funciona
- Realtime funciona
- Progress funciona
- ES funciona
- EN funciona
- mobile funciona
- desktop funciona
- RLS funciona
- migrations funcionan
- seed funciona
- importer funciona
- tests pasan
- build pasa

---

# 201. DOCUMENTACIÓN FINAL

Crear o actualizar:

```text
DOCUMENTACION_TECNICA.md
```

Agregar:

- arquitectura de Nutrition
- nuevas tablas
- nuevas relaciones
- migraciones
- RLS
- Realtime
- food datasets
- licenses
- importer
- nutrition calculations
- meal planning
- food logs
- grocery generation
- household
- nuevas rutas
- nuevos componentes
- nuevas acciones
- tests
- limitaciones
- decisiones técnicas

Mantener la documentación alineada con el estado REAL del código.

---

# 202. FINAL INSTRUCTION

No te limites a proponer esta arquitectura.

IMPLEMENTA LA FUNCIONALIDAD.

Antes de comenzar a escribir código:

1. inspecciona el proyecto actual
2. inspecciona la documentación técnica
3. inspecciona las migraciones
4. inspecciona el dataset TACO
5. verifica licencias
6. define el modelo de datos
7. implementa migraciones
8. implementa importer
9. genera tipos
10. implementa dominio
11. implementa repository
12. implementa UI
13. implementa Realtime
14. implementa tests
15. ejecuta QA
16. corrige errores
17. actualiza documentación

No reemplazar funcionalidades existentes sin una razón fuerte.

No crear una arquitectura paralela.

No utilizar APIs pagas.

No inventar la estructura de datasets.

No guardar contraseñas en texto plano.

No exponer service-role keys.

No dejar funcionalidades principales sin implementar.

La aplicación final debe sentirse como una evolución natural de Train Together y debe resolver el problema central:

> Ayudar a dos personas a planificar, ejecutar y coordinar su alimentación con la menor cantidad posible de decisiones y trabajo manual, manteniendo al mismo tiempo control, trazabilidad, flexibilidad y visibilidad compartida.
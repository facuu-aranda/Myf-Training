# Agente de Auditoría UI — Nuvia / Train Together

> **Rol:** Senior UI Designer / Design Systems Auditor especializado en SaaS, dashboards, fitness, responsive web y aplicaciones mobile.
> **Objetivo:** revisar Nuvia / Train Together pantalla por pantalla, componente por componente y flujo por flujo para detectar inconsistencias de layout, spacing, tipografía, color, jerarquía, responsive, componentes, estados, accesibilidad visual y calidad general del sistema de diseño.
> **Modo:** ANALYZE ONLY. No modificar código salvo instrucción posterior explícita.

---

# 1. Entregable obligatorio

Al finalizar, crear:

```text
Reporte-ui-YYYY-MM-DD-HH-mm.md
```

Ejemplo:

```text
Reporte-ui-2026-09-09-11-12.md
```

Usar hora real, formato 24h. No sobrescribir reportes anteriores. Si no hay timezone local, usar UTC y declararlo.

---

# 2. Regla principal

No aceptar observaciones vagas como:

```text
"Los paddings podrían mejorar."
"Los colores son inconsistentes."
"El responsive necesita trabajo."
```

Cada hallazgo debe incluir:

```text
pantalla
ruta
componente
viewport
valor/patrón observado
problema
patrón esperado
recomendación concreta
impacto
prioridad
effort
acceptance criteria
```

Cuando sea posible, medir valores reales.

---

# 3. Alcance

Auditar toda superficie visible:

```text
Landing
Login
Onboarding
Dashboard
Strategy
Live Training
Manual Training
Quick Log
Progress
History
Exercise Library
Profile
People
Public Profile
Couple
Household
Food Library
Recipes
Food Log
Meal Planner
Grocery
Insights
AI
Coach Dashboard
Coach Roster
Athlete Detail
Coach Strategy
Coach Analytics
Coach Notes
Templates
Reports
Pricing
Billing
Upgrade prompts
Empty states
Loading states
Errors
Modals
Drawers
Toasts
Tables
Charts
Forms
Navigation
```

---

# 4. Contexto de producto

Nuvia tiene tres familias visuales de experiencia:

```text
PERSONAL
TOGETHER
PROFESSIONAL
```

Planes:

```text
Free
Plus
Couple
Household
Coach Starter
Coach Pro
```

La interfaz debe mantener una identidad visual común.

Coach puede tener mayor densidad de información, pero no parecer una aplicación distinta.

---

# 5. Pregunta principal

El reporte debe responder:

> **¿La aplicación parece un producto único, coherente y profesional en cada pantalla, viewport y estado, o una colección de pantallas desarrolladas de forma independiente?**

---

# 6. Metodología pantalla por pantalla

Para cada pantalla:

1. revisar desktop;
2. tablet;
3. mobile;
4. identificar container;
5. medir paddings;
6. medir gaps;
7. revisar grid;
8. revisar jerarquía;
9. revisar tipografía;
10. revisar color;
11. revisar componentes;
12. revisar estados;
13. revisar responsive;
14. revisar accesibilidad visual;
15. documentar inconsistencias.

---

# 7. Viewports obligatorios

Como mínimo:

```text
320 × 568
360 × 800
390 × 844
430 × 932
768 × 1024
1024 × 768
1280 × 800
1440 × 900
1920 × 1080
```

No limitar auditoría a “mobile” y “desktop”.

---

# 8. Overflow

Buscar:

```text
horizontal scroll
clipped text
cards outside viewport
modals too wide
tables overflowing
charts clipped
sticky overlaps
buttons off-screen
```

Todo overflow inesperado debe documentarse.

---

# 9. Design Tokens

Inspeccionar si hay sistema consistente para:

```text
colors
spacing
radius
shadow
typography
breakpoints
z-index
animation
```

Detectar:

```text
magic values
duplicates
near-identical colors
inconsistent radii
arbitrary margins
```

---

# 10. Spacing Scale

Construir inventario aproximado.

Buscar coherencia en escala tipo:

```text
4
8
12
16
20
24
32
40
48
64
```

No exigir exactamente esa escala.

Detectar valores arbitrarios sin intención.

---

# 11. Page Containers

Revisar:

```text
max-width
horizontal padding
centering
wide-screen behavior
mobile gutter
```

Preguntas:

- ¿cada página usa distinto padding?
- ¿títulos se alinean?
- ¿cards/charts comparten grid?
- ¿hay páginas pegadas a bordes?

---

# 12. Vertical Rhythm

Comparar:

```text
page title → subtitle
section → section
heading → card
card → card
label → input
input → error
```

---

# 13. Cards

Inventariar:

```text
standard
metric
interactive
dashboard
nutrition
athlete
pricing
```

Revisar:

- padding;
- radius;
- border;
- background;
- shadow;
- header;
- footer;
- hover;
- active;
- disabled.

---

# 14. Typography

Inventariar:

```text
font family
display
H1
H2
H3
body
small
label
caption
button
numeric metric
```

Revisar:

- size;
- weight;
- line-height;
- letter-spacing;
- casing;
- truncation;
- responsive scale.

---

# 15. Hierarchy

Cada pantalla debe distinguir:

```text
Page
Section
Subsection
Card title
Label
Supporting text
```

sin jerarquías ambiguas.

---

# 16. Text Expansion

Probar:

- nombres largos;
- exercise names;
- Coach names;
- Household names;
- translated strings.

---

# 17. i18n UI

Si ES/EN:

probar ambos.

Detectar overflow en:

```text
buttons
tabs
sidebar
modal
pricing cards
```

---

# 18. Color System

Mapear:

```text
background
surface
surface elevated
primary
secondary
accent
text
muted
border
success
warning
danger
info
```

Detectar duplicaciones.

---

# 19. Semantic Colors

Estados:

```text
success
error
warning
pending
disabled
info
```

deben ser consistentes.

---

# 20. Contrast

Revisar:

```text
muted text
placeholder
disabled
chart labels
caption
badge
dark mode if exists
```

Medir WCAG si herramientas disponibles.

---

# 21. Color-only Communication

No depender sólo de color para:

```text
error
success
status
Needs Attention
```

---

# 22. Buttons

Inventariar:

```text
primary
secondary
tertiary
ghost
danger
icon
link
```

Comparar:

- height;
- padding;
- radius;
- icon gap;
- font;
- hover;
- focus;
- active;
- disabled;
- loading.

---

# 23. Button Hierarchy

Detectar:

```text
multiple competing primary CTAs
```

o acción primaria visualmente secundaria.

---

# 24. Touch Targets

Mobile:

objetivo mínimo aproximado:

```text
44 × 44 px
```

para acciones críticas.

---

# 25. Icons

Revisar:

- librería;
- stroke;
- size;
- alignment;
- semantics;
- tooltip;
- labels.

---

# 26. Forms

Auditar:

```text
input
textarea
select
date
number
search
```

Estados:

```text
default
focus
error
success
disabled
read-only
```

Revisar:

- height;
- labels;
- helper text;
- spacing;
- errors.

---

# 27. Numeric Fields

Fitness usa:

```text
kg
reps
seconds
calories
grams
steps
```

Revisar consistencia de valor/unidad.

---

# 28. Tables

Auditar:

```text
header
row density
hover
selected
empty
loading
actions
mobile behavior
horizontal scroll
sticky columns
```

No comprimir tabla desktop ilegible en 360px.

---

# 29. Charts

Revisar:

```text
size
aspect ratio
legend
labels
tooltip
axis
grid
colors
empty
responsive
```

---

# 30. Dashboard Grid

Auditar:

- column count;
- card alignment;
- equal-height where relevant;
- responsive reflow;
- order by priority.

Mobile no debe apilar arbitrariamente.

---

# 31. Navigation

Revisar:

```text
sidebar
top bar
bottom nav
active state
icons
spacing
collapse
mobile menu
```

---

# 32. Sidebar

Auditar:

- width;
- section grouping;
- active state;
- icon alignment;
- long labels;
- scroll;
- account section.

---

# 33. Bottom Navigation

Mobile:

- safe area;
- icon size;
- active state;
- labels;
- max items;
- keyboard overlap.

---

# 34. Modals

Auditar:

```text
width
max-height
scroll
header
body
footer
close
overlay
radius
mobile adaptation
```

---

# 35. Drawers / Sheets

Revisar:

- height;
- scroll;
- drag affordance;
- footer actions;
- safe area;
- focus.

---

# 36. Toasts

Revisar:

- position;
- stacking;
- duration;
- mobile;
- overlap;
- semantic style;
- dismiss.

---

# 37. Tooltips

No usar tooltip como única forma de entender controles críticos en mobile.

---

# 38. Badges

Inventariar:

```text
active
pending
expired
draft
published
Plus
Coach
Needs Attention
```

Comparar:

- padding;
- font;
- radius;
- color.

---

# 39. Avatars

Revisar:

- sizes;
- fallback;
- initials;
- crop;
- border;
- roster/profile consistency.

---

# 40. Images / Media

Evaluar:

```text
aspect ratio
object-fit
loading
skeleton
error fallback
```

---

# 41. Exercise Media

GIF/video/image:

- stable container;
- no layout shift;
- placeholder;
- controls;
- mobile sizing.

---

# 42. Loading UI

Comparar:

```text
spinner
skeleton
button spinner
chart skeleton
table skeleton
```

Evitar estilos incompatibles.

---

# 43. Empty States

Sistema visual común:

```text
icon
title
description
CTA
```

---

# 44. Error States

Revisar:

```text
inline
form
page
card
network
permission
```

---

# 45. Disabled vs Read-only

Especialmente Strategy coach-managed.

Distinguir visualmente:

```text
disabled/unavailable
```

de:

```text
read-only/managed by Coach
```

No usar sólo opacity.

---

# 46. Focus States

Revisar:

```text
button
input
link
card
tab
menu
```

No eliminar outline sin reemplazo.

---

# 47. Hover

Desktop:

- consistente;
- no excesivo;
- no depender de hover para acciones críticas.

---

# 48. Pressed / Active

Controles interactivos deben responder visualmente.

---

# 49. Motion

Inventariar Framer Motion/CSS.

Revisar:

- duration;
- easing;
- consistency;
- purpose;
- layout shift;
- reduced motion.

---

# 50. Reduced Motion

Respetar:

```text
prefers-reduced-motion
```

si hay animaciones relevantes.

---

# 51. Responsive Strategy

Para cada pantalla responder:

```text
qué cambia
qué desaparece
qué apila
qué scrollea
qué se convierte en drawer/sheet
```

No aceptar “desktop reducido”.

---

# 52. Breakpoints

Mapear breakpoints reales.

Detectar:

- Tailwind/CSS conflict;
- breakpoints arbitrarios;
- zonas incómodas 900–1200px.

---

# 53. 320px

Prueba obligatoria.

Buscar:

- tabs;
- pricing;
- modals;
- buttons;
- charts;
- forms;
- nav.

---

# 54. 390px

Viewport mobile principal.

---

# 55. Tablet

768–1024.

Tablet no debe quedar en limbo.

---

# 56. Wide Desktop

1440–1920.

Buscar:

- content demasiado ancho;
- cards gigantes;
- exceso de espacio vacío;
- content pegado a izquierda.

---

# 57. Landing

Auditar:

```text
hero
navigation
feature sections
screenshots
pricing
FAQ
footer
```

---

# 58. Landing Hierarchy

Debe entenderse:

```text
what
who
why
CTA
```

sin recorrer toda la página.

---

# 59. Pricing Cards

Revisar:

- grupos Personal/Together/Professional;
- recommended;
- price hierarchy;
- monthly/annual;
- feature list;
- CTA;
- equal heights;
- mobile.

---

# 60. Comparison Table

Desktop puede ser tabla.

Mobile debe transformarse en patrón legible:

```text
accordion
plan selector
stacked comparison
```

---

# 61. Personal UI

Comparar:

```text
Dashboard
Strategy
Training
Progress
History
Profile
```

Buscar inconsistencias.

---

# 62. Strategy UI

Especial atención a:

- dense forms;
- day cards;
- exercise rows;
- numeric controls;
- drag handles;
- managed state;
- Draft/Published badges.

---

# 63. Live Training UI

Jerarquía debe priorizar:

```text
exercise
set
weight
reps
rest
next
```

---

# 64. Progress UI

Charts deben compartir sistema visual.

---

# 65. Nutrition UI

Comparar:

```text
Food Library
Recipes
Food Log
Planner
Grocery
Insights
```

Detectar módulos que parezcan apps distintas.

---

# 66. Grocery UI

Mobile crítica.

Checkbox, quantity y row actions no deben competir.

---

# 67. Couple / Household UI

Distinguir:

```text
members
shared
private
```

sin crear identidad visual aparte.

---

# 68. Coach UI

Puede ser más densa, pero debe reutilizar:

```text
tokens
cards
type
controls
navigation patterns
```

---

# 69. Coach Roster

Revisar athlete row/card:

```text
avatar
name
status
adherence
last activity
alert
actions
```

---

# 70. Athlete Detail

Subnavigation debe funcionar con muchas tabs.

Mobile:

evaluar scroll horizontal, segmented control o alternativa.

---

# 71. Needs Attention

No abusar del rojo.

Diferenciar:

```text
needs review
```

de:

```text
error/critical
```

---

# 72. Templates

Visualmente debe quedar claro:

```text
Template
≠ Athlete Strategy
```

---

# 73. Reports

Preview/export deben verse profesionales.

---

# 74. Billing

Auditar:

```text
current plan
status
price
interval
usage
actions
```

---

# 75. Ads

Free:

- reservar espacio;
- no CLS;
- no romper layout;
- premium no deja huecos;
- respetar labeling del provider.

---

# 76. Dark Mode

Si existe, auditar todo.

Revisar:

- surface;
- border;
- charts;
- states;
- disabled;
- focus.

---

# 77. Z-index

Buscar:

```text
modal under header
toast under drawer
dropdown behind card
sticky over modal
```

---

# 78. Scroll

Auditar:

- nested scroll;
- body lock;
- modal scroll;
- sticky;
- route transitions.

---

# 79. Sticky Elements

Mobile: no ocupar demasiado viewport.

---

# 80. Safe Areas

Mobile/Expo:

```text
notch
home indicator
bottom nav
sheet
```

---

# 81. Keyboard

Formularios mobile:

- input visible;
- submit reachable;
- nav no overlay.

---

# 82. Density

Coach Pro puede necesitar más densidad.

No usar valores arbitrarios: definir patrón.

---

# 83. Design System Debt

Inventariar duplicados:

```text
buttons
cards
inputs
modals
badges
page headers
tabs
```

---

# 84. Component Consolidation

Para cada duplicado:

```text
variants
differences
canonical recommendation
migration impact
```

---

# 85. CSS Architecture

Inspeccionar:

```text
Tailwind
custom CSS
inline styles
arbitrary values
component styles
```

Detectar conflictos.

---

# 86. Magic Values

Listar valores visuales repetidos no tokenizados.

---

# 87. Radius

Inventariar y reducir variantes innecesarias.

---

# 88. Shadows

Detectar sombras casi idénticas.

---

# 89. Borders

Revisar:

- color;
- opacity;
- width;
- focus border.

---

# 90. Icon Buttons

Siempre:

- accessible name;
- square size consistente;
- tooltip si ambiguo.

---

# 91. Chart Palette

No generar paletas ad-hoc por chart.

---

# 92. Metric Cards

Comparar:

```text
steps
calories
volume
adherence
PRs
```

Número principal consistente.

---

# 93. Number Formatting

Definir patrones:

```text
10,000
10.2k
2,300 kcal
180 g
82%
```

Consistencia ES/EN.

---

# 94. Units

Unidad visualmente ligada al valor.

---

# 95. Truncation

Ellipsis sólo si existe forma de acceder al texto completo cuando sea relevante.

---

# 96. Responsive Tables / Charts

No aceptar `overflow-x:auto` como única solución universal.

Evaluar cards en mobile.

---

# 97. Accessibility Visual

Revisar:

```text
contrast
focus
target size
text zoom
semantic states
charts
```

---

# 98. Text Zoom

Probar 200% si posible.

---

# 99. Browser Zoom

Desktop:

```text
125%
150%
```

Buscar layouts frágiles.

---

# 100. Priority

```text
P0 — unusable/severe responsive/accessibility break
P1 — major inconsistency or task-impacting visual issue
P2 — visible quality issue
P3 — refinement
```

---

# 101. Scope

Clasificar:

```text
local
component
system
responsive
design-system
```

---

# 102. Effort

```text
XS
S
M
L
XL
```

No estimar horas exactas.

---

# 103. Evidence

Cada hallazgo:

```text
route
viewport
component
CSS class/style if available
screenshot reference if available
```

---

# 104. Before / After

Cuando sea posible:

```text
Observed:
Card padding 10px Dashboard, 16px Progress, 20px Coaching.

Recommendation:
Standard card padding token: 16px mobile / 20px desktop.
```

---

# 105. No Redesign by Taste

No cambiar branding completo por preferencia subjetiva.

Priorizar:

```text
consistency
clarity
accessibility
responsive
maintainability
```

---

# 106. Quick Wins

Crear sección de:

```text
low effort
medium/high impact
low risk
```

---

# 107. Design System Recommendations

Después de auditar, proponer:

```text
tokens
components
layout primitives
responsive rules
```

---

# 108. Reporte obligatorio

`Reporte-ui-[timestamp].md`:

```text
# Reporte UI — Nuvia

## Metadata
- Date/time
- Timezone
- Environment
- Branch/commit
- Viewports
- Themes
- Languages

## Executive Summary
## Overall UI Score
## Top 10 Critical Findings
## Design System Health

## Global Layout
## Spacing
## Typography
## Color
## Components
## Navigation
## Forms
## Cards
## Tables
## Charts
## Modals / Drawers
## Feedback States

## Landing
## Authentication / Onboarding

## Personal
### Dashboard
### Strategy
### Training
### Progress
### History
### Exercises
### Profile

## Nutrition
### Food Library
### Recipes
### Food Log
### Planner
### Grocery
### Insights

## Couple / Household

## Coaching
### Dashboard
### Roster
### Athlete Detail
### Strategy
### Analytics
### Templates
### Reports

## Billing / Pricing

## Responsive Audit
### 320
### 360
### 390
### 430
### 768
### 1024
### 1280
### 1440
### 1920

## Accessibility Visual Audit
## Component Duplication
## Token Recommendations
## Quick Wins
## P0
## P1
## P2
## P3
## Recommended Implementation Order
## Appendix — Screen Matrix
```

---

# 109. Score

0–100 con subscores:

```text
Visual consistency
Spacing
Typography
Color
Component consistency
Responsive
Accessibility
Information hierarchy
State design
Design system maintainability
```

---

# 110. Template de hallazgo

```markdown
### UI-041 — Título concreto

**Priority:** P2
**Scope:** system
**Effort:** S
**Route:** `/app/...`
**Viewport:** 390×844
**Component:** ...

**Observed**
...

**Expected pattern**
...

**Impact**
...

**Recommendation**
...

**Acceptance criteria**
- ...
- ...
```

---

# 111. Screen Matrix

Por cada ruta:

```text
Route
Desktop
Tablet
Mobile
Overflow
Spacing
Typography
Components
States
Severity
```

---

# 112. Pixel-level Audit

No significa discutir 1px sin motivo.

Registrar sólo diferencias visuales relevantes o sistémicas.

---

# 113. Responsive Severity

Un bug sólo en 320px puede seguir siendo P0/P1 si bloquea una tarea.

---

# 114. Screenshots

Si herramientas lo permiten:

- capturar issue;
- viewport visible;
- naming claro;
- referenciar en reporte.

---

# 115. Browser / Device

Si se puede:

```text
Chrome
Safari/iOS
Android
```

Registrar diferencias.

---

# 116. Mobile App

Si build Expo está disponible, auditar UI nativa también.

No asumir que web responsive = mobile app.

---

# 117. Web vs Mobile

Comparar:

```text
colors
typography
spacing
icons
components
terminology
```

sin exigir layouts idénticos.

---

# 118. Branding

Si conviven “Train Together” y “Nuvia”, registrar inconsistencias.

No renombrar durante auditoría.

---

# 119. No modificar código

Por defecto:

```text
ANALYZE ONLY
```

No editar CSS.
No cambiar Tailwind config.
No aplicar fixes.
No crear PR.

---

# 120. Definition of Done

La auditoría termina cuando:

- todas las rutas accesibles fueron inspeccionadas;
- todos los viewports obligatorios fueron probados razonablemente;
- se identificaron inconsistencias globales;
- se detectaron duplicados de componentes;
- se evaluó responsive;
- se evaluó accesibilidad visual;
- P0/P1 tienen acceptance criteria;
- existe `Reporte-ui-YYYY-MM-DD-HH-mm.md`.

---

# 121. Cierre

El reporte debe responder con evidencia:

> **¿La interfaz de Nuvia se comporta como un sistema visual coherente, accesible y responsive, o como una colección de pantallas desarrolladas de forma independiente?**

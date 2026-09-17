# Reporte integral de estado — MyF-Training

## 1. Ficha del análisis

| Campo | Valor |
|---|---|
| Fecha | 2026-09-17 |
| Repositorio | `MyF-Training` / `train-together` |
| Rama y commit observado | `main` / `c2a7dcc` (`backup`) |
| Estado de cambios al iniciar | Sin cambios versionados; `.env` y `node_modules` ignorados |
| Alcance | Estructura, aplicación web, Supabase, Edge Functions, migraciones, scripts, pruebas, dependencias, documentación y riesgos |
| Evidencia dinámica | `yarn.cmd lint`, `yarn.cmd typecheck`, `yarn.cmd test --run`, `yarn.cmd build`, `yarn.cmd db:check` |
| Criterio de urgencia | Crítica: bloquea seguridad/producción; Alta: bloquea una entrega o capacidad comercial importante; Media: deuda funcional/técnica relevante; Baja: mejora o alcance diferido |

> Este documento refleja lo comprobable en el repositorio y en la base Supabase accesible durante el análisis. No se exponen valores del archivo `.env` ni credenciales.

## 2. Resumen ejecutivo

El proyecto está en un estado **funcional y compilable**, con una base de producto amplia: SPA React/Vite, autenticación, entrenamiento, nutrición, social/household, una foundation de coaching, AI read-oriented y una foundation comercial/billing con Mercado Pago. La verificación local fue completamente exitosa y el `db:check` remoto pasó correctamente.

La principal conclusión objetiva es que el repositorio está más avanzado que un MVP visual, pero **todavía no está listo para declarar producción comercial completa**. Las áreas que impiden esa conclusión son:

1. Billing tiene catálogo, RPCs, Edge Functions y UI, pero faltan pruebas de integración reales, configuración productiva y enforcement server-side completo de varias capacidades.
2. Coaching tiene una foundation sólida y un overview privado, pero faltan planes Coach completos con ciclo Draft/Review/Publish, UX de permisos granular completa y validación E2E/remota de todas las migraciones recientes.
3. AI dispone de chat y tools de lectura, pero el flujo de acciones de escritura sigue inestable/diferido y existen migraciones de acciones que deben mantenerse controladas.
4. La cobertura automática existente es principalmente unitaria/determinista: 35 tests en 7 archivos; no hay E2E ni pruebas RLS contra una base real.
5. La documentación no está totalmente sincronizada con el estado actual: algunos documentos de 2026-09-07/08/09 describen pendientes que el código o la base ya cubren parcialmente.

## 3. Inventario y arquitectura observada

### 3.1 Tamaño aproximado

- 79 archivos fuente TypeScript/TSX bajo `src`.
- 27 páginas React.
- 49 migraciones SQL versionadas.
- 6 archivos de Edge Functions/infraestructura Deno.
- 7 archivos de pruebas con 35 casos ejecutados.
- 5 scripts operativos principales de seed/diagnóstico, además de configuración de Vite, ESLint, TypeScript, Vitest y Vercel.

### 3.2 Stack

- React 19 + React Router 6.
- TypeScript 5.7 con configuración estricta y Vite 6.
- Supabase JS 2 para Auth, PostgreSQL, RPC y Realtime.
- PostgreSQL/Supabase con RLS, funciones `security definer`, triggers y migraciones.
- Tailwind CSS 3, CSS propio, Framer Motion, Recharts y Lucide.
- i18next/react-i18next para español e inglés.
- Vitest + jsdom, ESLint 9 y scripts `tsx`.
- Yarn 1; `yarn.lock` presente.

### 3.3 Arquitectura funcional

- `src/App.tsx` define landing, login y rutas protegidas lazy-loaded.
- `AuthContext` gestiona sesión remota y fallback local/demo.
- `FitnessContext` concentra gran parte del estado de dominio.
- `src/lib/repository.ts` y módulos de `src/lib` separan persistencia y lógica por área.
- Supabase es el backend principal; no existe una API backend propia.
- El modo sin variables públicas de Supabase permite demo local y persistencia en `localStorage`.
- Hay `vercel.json` para fallback SPA, pero no hay pipeline CI/CD en el repositorio.

## 4. Estado por área

| Área | Estado actual | Evaluación |
|---|---|---|
| Landing, login y routing | Implementados; rutas protegidas y lazy loading activos | Verde |
| Auth password/demo | Implementado con fallback local | Verde con configuración externa pendiente |
| Google OAuth | Código y trigger preparados | Amarillo: requiere provider, callbacks y pruebas de regresión |
| Entrenamiento manual/rápido/live | Implementado | Verde |
| Estrategia | Objetivos, días, ejercicios y bloqueo por gestión Coach | Verde funcional; versionado aún parcial |
| Progreso/historial/PRs | Implementado con cálculos cliente | Amarillo: límites comerciales no siempre están respaldados por queries server-side |
| Biblioteca de ejercicios | Implementada; base remota verificada con 1.324 ejercicios | Verde |
| Nutrición | Foods, recipes, Food Log, Meal Planner, Grocery e Insights | Verde funcional |
| Custom Foods | Ownership/RLS y UI existentes | Amarillo: gate server-side comercial pendiente de completar |
| Custom Exercises | Modelo privado/system/space y página existentes | Amarillo: media/moderación y gate server-side pendientes |
| Household | Implementado y operativo; tablas legacy `couples` siguen presentes | Verde/amarillo por deuda de compatibilidad |
| Follow/social | Lifecycle SQL agregado; uso y UX aún más limitados que Household | Amarillo |
| Realtime | Tablas fitness, nutrición, social, household y coaching presentes en publicación | Verde en check; falta validar reconexión/refresh en UX |
| Coaching foundation | Spaces, memberships, relaciones, invitaciones, roster, overview, permisos iniciales, notes/audit y Strategy management | Amarillo: foundation, no producto Coach completo |
| AI | Chat server-side con Groq y tools de lectura; acción `create_custom_food` existe en código pero el estado global de actions no es estable | Amarillo/rojo para write actions |
| Billing comercial | Planes, prices, entitlements, checkout intent, funciones Mercado Pago, webhook y UI | Amarillo: no declarar producción hasta integración real y gates server-side |
| CI/CD | Existe `yarn ci` local y Vercel rewrite | Rojo como proceso de entrega: no hay workflow/pipeline/deploy documentado |
| Email recovery/verification | No implementados en el alcance actual | Amarillo |
| Wearables | No implementados | Baja/diferida |

## 5. Validaciones ejecutadas

### 5.1 Calidad local

| Comando | Resultado | Detalle |
|---|---|---|
| `yarn.cmd lint` | PASÓ | ESLint sin warnings ni errores con `--max-warnings 0` |
| `yarn.cmd typecheck` | PASÓ | `tsc --noEmit` sin errores |
| `yarn.cmd test --run` | PASÓ | 7 archivos, 35 tests aprobados |
| `yarn.cmd build` | PASÓ | 2.732 módulos transformados; build Vite generado en `dist/` |
| `yarn ci` | No ejecutado literalmente | En PowerShell `yarn` está bloqueado por execution policy; sus cuatro etapas equivalentes sí se ejecutaron mediante `yarn.cmd` |

Los tests cubren lógica de fitness, workout builder, custom foods, foundation AI, foundation coaching, entitlements y contrato Mercado Pago. No cubren el navegador completo ni autorización RLS en una base real.

### 5.2 Base Supabase remota

`yarn.cmd db:check` **PASÓ** durante este análisis. Datos observados:

- 18 usuarios Auth y 18 perfiles.
- 5 households y 7 miembros.
- 8.756 foods y 8.756 traducciones; 11.361 porciones y 565 aliases.
- 1.324 ejercicios.
- 12 sesiones, 129 sets, 20 PRs y 42 métricas diarias.
- 3 spaces, 10 memberships y 7 relaciones Coach/Athlete.
- 1 invitación, 1 capability, 1 strategy management, 56 permisos de relaciones y 1 audit log.
- 8 planes comerciales, 12 precios, 29 definiciones de entitlement y 83 asignaciones plan-entitlement.
- 5 subscriptions y 4 checkout intents; no había billing customers, subscription events, usage counters ni provider price mappings.
- Todas las tablas Realtime esperadas por el script fueron encontradas.
- Food translations: 8.756/8.756.

Este check demuestra conectividad, esquema y datos mínimos consistentes; **no sustituye pruebas de autorización, checkout, webhook ni flujos E2E**.

## 6. Pendientes clasificados por urgencia

### Crítica

#### C1. Validar seguridad y operación de Billing antes de producción

**Estado:** La implementación ya tiene tablas, RPC, cliente, checkout function y webhook, pero el flujo depende de secretos/configuración externa y no tiene evidencia de una transacción real de punta a punta.

**Pendiente:**

- Configurar y validar Mercado Pago Sandbox/producción en Edge Functions.
- Ejecutar checkout, callback/webhook, actualización de subscription y resolución de entitlements en un entorno controlado.
- Validar idempotencia de eventos y reintentos.
- Confirmar que ningún gate premium dependa sólo de `FeatureGate` en frontend.
- Agregar pruebas de integración/RLS con Supabase real.

**Riesgo:** Cobros, estados de suscripción o acceso premium incorrectos. No habilitar cobro real hasta cerrar este punto.

**Referencias:** `supabase/functions/billing-create-checkout/index.ts`, `supabase/functions/mercadopago-webhook/index.ts`, `src/lib/billing.ts`, `docs/COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md`.

#### C2. Mantener las AI write actions bajo control hasta completar el rediseño

**Estado:** El chat read-only está descrito como estable. El repositorio conserva migraciones `20260903120000`–`20260903140000` para acciones; el código de `ai-assistant` contiene reserva/ejecución para `create_custom_food`, pero también declara en el prompt que el MVP no tiene write tools. La documentación registra regresiones previas de tool loop y recomienda no reactivar acciones avanzadas.

**Pendiente:**

- Definir un executor determinista por acción.
- Mantener schema versionado, confirmación humana, idempotency key y resultado visible.
- Probar doble click/retry sin duplicados.
- Diferenciar errores 400, 429 y 5xx del provider.
- Verificar el historial remoto antes de aplicar migraciones AI diferidas.

**Riesgo:** Acción duplicada, estado inconsistente o diferencia entre lo que el UI anuncia y lo que el backend permite.

**Referencia:** `docs/AI_BACKLOG.md`, `supabase/functions/ai-assistant/index.ts`.

### Alta

#### A1. Cerrar la entrega Coach/Athlete de extremo a extremo

**Estado:** La base está presente y el `db:check` muestra datos de coaching, pero el producto todavía no ofrece el ciclo completo de planes Coach.

**Pendiente:**

- Plan de entrenamiento Coach con Draft → Review → Publish → Active.
- Plan nutricional Coach equivalente sin sobrescribir Food Log real.
- Permisos granulares completos y UX de edición por permiso, no sólo por rol.
- Cancelación, expiración, reenvío e historial de invitaciones con mensajes diferenciados.
- Validar en remoto las migraciones de la ronda 2026-09-07 y ejecutar pruebas E2E de ownership/privacidad.

**Riesgo:** Datos de atleta expuestos o comportamiento ambiguo cuando Coach y atleta editan una estrategia.

#### A2. Completar gates comerciales server-side

**Estado:** Hay resolver de entitlements y gates de UX; la propia auditoría comercial reconoce enforcement pendiente para AI, custom food/exercise, exports, strategy versions, historial y límites Coach.

**Pendiente:** Aplicar la capacidad efectiva dentro de cada RPC/mutación, resolver cuotas AI y validar límites de seats/athletes en servidor.

**Riesgo:** Usuarios pueden evadir límites comerciales llamando directamente a RPC o manipulando el cliente.

**Referencia:** `docs/COMMERCIAL_PLAN_FEATURE_GAP_ANALYSIS.md`, `src/components/FeatureGate.tsx`, `src/lib/entitlements.ts`.

#### A3. Crear pruebas E2E y de seguridad de datos

**Estado:** La suite pasa, pero sus 35 casos son unitarios/contractuales y no prueban navegación autenticada, OAuth, Realtime, RLS real, coaching ni billing completo.

**Pendiente:**

- E2E de onboarding, login, household, coaching, nutrition, AI read-only y billing sandbox.
- Tests con dos identidades para ownership y RLS.
- Pruebas de expiración y revocación de invitaciones.
- Pruebas de reconexión Realtime y actualización selectiva.

**Riesgo:** El build verde no garantiza la seguridad ni los flujos reales del producto.

#### A4. Formalizar despliegue y configuración de entornos

**Estado:** Hay `vercel.json`, scripts locales y `.env.example`, pero no workflow CI/CD, proceso de migración, gestión de secretos, rollback o checklist de producción versionado.

**Pendiente:** Pipeline lint/typecheck/test/build, deploy preview/staging/production, aplicación controlada de migraciones, variables por entorno, observabilidad y rollback.

**Riesgo:** Releases manuales no reproducibles y migraciones/Edge Functions fuera de sincronización.

### Media

#### M1. Completar `strategy_versions`

Listado, detalle, comparación, restauración, metadata (`created_by`, fechas efectivas, motivo) y estados de ciclo de vida aún requieren consolidación en UI y pruebas.

#### M2. Completar Follow/social

El SQL tiene lifecycle, pero la UX y el flujo completo de estados, bandeja, aceptación/rechazo, bloqueo y notificaciones siguen menos desarrollados que Household.

#### M3. Mejorar modelo de tipos Supabase

`src/types/database.ts` es manual y el cliente de `src/lib/supabase.ts` no está parametrizado con el tipo `Database`, lo que reduce la protección estática de consultas y RPCs.

#### M4. Unificar documentación de estado

`README.md` sólo contiene el título. `DOCUMENTACION_TECNICA.md`, `PROJECT_STATUS_AND_ROADMAP.md` y `REMAINING_WORK_AND_DECISIONS.md` fueron escritos en fechas distintas y presentan estados parcialmente desactualizados frente a la base actual: por ejemplo, billing/coaching ya tienen más código y datos que algunos resúmenes anteriores indican.

#### M5. Consistencia de errores, loading y accesibilidad

La documentación identifica pendientes en modales, formularios, navegación por teclado, estados de carga y errores uniformes. Debe revisarse especialmente en rutas protegidas, checkout, OAuth y Realtime.

#### M6. Resolver deuda de compatibilidad Household/Spaces

`households` sigue siendo operativo mientras `spaces` ya existe para coaching. Falta una capa clara de compatibilidad para múltiples espacios sin romper Nutrition, Grocery, invitaciones, RLS y Realtime.

### Baja / diferida

#### B1. Wearables e integraciones de actividad

Pasos, calorías y peso continúan siendo entradas manuales. Es alcance posterior, no bloqueante para el producto base.

#### B2. Email verification/recovery

No implementado según el alcance actual; debe priorizarse antes de una estrategia de adquisición/retención de producción.

#### B3. User-generated content avanzado

Moderación, media assets, thumbnails, procesamiento y publicación pública de ejercicios quedan fuera de la foundation actual.

#### B4. Voz y conversaciones AI persistentes

Voz, historial persistente, retención y borrado de conversaciones están diferidos en `docs/AI_BACKLOG.md`.

#### B5. Escala comercial avanzada

Coach Studio, add-ons, publicidad, targeting, marketplace y seat billing avanzado deben mantenerse fuera hasta cerrar permisos, ownership y checkout base.

## 7. Riesgos técnicos y observaciones

1. **Documentación vs código:** algunos documentos anteriores describen billing como conceptual o coaching como preparado localmente, mientras el commit actual y la base remota ya contienen implementación y datos adicionales. El status debe tener una única fuente de verdad.
2. **Tipos de base manuales:** pueden quedar desalineados de las 49 migraciones y ocultar cambios de esquema.
3. **Cobertura:** todos los checks locales verdes sólo validan compilación, lint y lógica aislada; no prueban RLS, permisos reales ni proveedor de pagos.
4. **Dependencias/runtime:** la instalación de Yarn terminó correctamente según el contexto de la sesión, aunque PowerShell bloquea `yarn.ps1`; en este entorno debe usarse `yarn.cmd` o corregirse la política local fuera del repositorio.
5. **Bundle:** el build genera chunks funcionales, pero los chunks gzip más grandes son `charts` (~110 kB), `index` (~97 kB), `supabase` (~58 kB) y `motion` (~43 kB). No es un fallo, pero conviene monitorear rendimiento móvil.
6. **Datos y secretos:** `.env` está ignorado y `.env.example` separa valores públicos de server-only; no se observó `.env` dentro de los archivos trackeados. Mantener esta separación en Edge Functions y CI.
7. **Proveedor externo:** imágenes/media externas en runtime y Mercado Pago pueden afectar presentación o cobros si no hay fallback/observabilidad.
8. **Derivados:** el recálculo general de PRs al borrar sets y otras consistencias derivadas deben revisarse en mutaciones destructivas.

## 8. Orden de trabajo recomendado

1. Congelar AI write actions y documentar explícitamente qué acciones están habilitadas en producción.
2. Ejecutar matriz de seguridad/RLS y E2E con identidades separadas.
3. Cerrar gates server-side y límites comerciales.
4. Validar Billing Sandbox completo, webhook firmado, idempotencia y resolución de entitlements.
5. Formalizar CI/CD, staging, migraciones y despliegue de Edge Functions.
6. Completar Coach Draft/Review/Publish y la matriz de permisos.
7. Consolidar Strategy Versions, Follow y compatibilidad Spaces/Households.
8. Mejorar tipado Supabase, errores, loading, accesibilidad y README.
9. Abordar wearables, UGC/media, AI persistente/voz y expansión comercial sólo después de lo anterior.

## 9. Dictamen final

**Estado general: AMARILLO — funcional para demo, desarrollo y validación controlada; no certificado para producción comercial completa.**

La base técnica es consistente: compila, pasa lint, typecheck, 35 tests y el diagnóstico remoto de Supabase. El producto tiene una superficie funcional considerable y no presenta bloqueos de calidad local inmediatos. Los bloqueadores reales son de **operación y seguridad de producto**: pruebas de integración insuficientes, monetización aún no probada de punta a punta, enforcement server-side incompleto y acciones AI con historial de regresiones.

Para pasar a un estado verde de producción, la evidencia mínima debe incluir: CI ejecutable, E2E/RLS contra Supabase, checkout/webhook sandbox exitoso, gates server-side verificados, flujo Coach autorizado probado con dos roles y una única documentación de estado actualizada.

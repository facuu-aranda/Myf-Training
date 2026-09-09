# Commercial plan feature gap analysis

> Auditoría basada en el código del repositorio al 2026-09-09. Los anuncios quedan fuera de esta fase operativa: sólo se deja el entitlement `ad_free` y un contrato de provider futuro.

## Resumen

La aplicación ya cuenta con autenticación, entrenamiento, nutrición, households y una foundation funcional de coaching. No existía un catálogo comercial ni una resolución centralizada de capacidades. La implementación de esta fase agrega esa base sin acoplar el frontend al proveedor de pagos.

| Área | Estado previo | Gap / decisión |
|---|---|---|
| Planes y precios | No existían tablas comerciales | Se agregan `plans` y `plan_prices`, con precios centralizados y vigencia |
| Entitlements | No había resolver comercial | Se agregan definiciones, valores por plan, grants y RPC efectivo |
| Suscripciones | No existían | Se agrega `subscriptions`, clientes, eventos y checkout intents |
| Mercado Pago | No existía | Se deja mapping server-side (`billing_provider_prices`) y estados; no se exponen credenciales ni se inventan IDs |
| Feature gates | No existían | Se agrega resolver frontend UX; la seguridad permanece en RLS/RPC |
| AI quota | El AI existía pero sin cuota comercial | Se agrega `usage_counters` y entitlement `ai_monthly_interactions`; el enforcement de cada acción queda como siguiente integración |
| Custom foods | Foundation privada existente | Debe consumir `custom_foods_create` en la mutación server-side |
| Custom exercises | Existe página y migraciones de ownership privado | Debe consumir `custom_exercises_create` en la mutación server-side |
| Strategy versions | Tabla y coaching implementados parcialmente | Se agregan capacidades comerciales; no se reescribe el flujo de coaching existente |
| Household | Modelo actual `households`/members con legacy couple | Se mantiene y se expresa capacidad mediante `household_create` y `household_max_members` |
| Coaching | Spaces, invitaciones, relaciones, permisos, notes y audit ya existen | Se expresa capacidad mediante entitlements; el enforcement de cupos queda en RPC/relaciones existentes |
| History/progress | Cálculo principalmente cliente | Gating UI inicial; consultas server-side acotadas deben seguir evolucionando antes de cobrar |
| Exports | Share card PNG existente, no export comercial general | `exports_personal` queda preparado, sin afirmar una capacidad inexistente |
| Ads | No provider ni slots | Sólo contrato abstracto y `ad_free`; no se renderizan anuncios ni se usan datos sensibles |
| Landing | Pricing legacy sólo Free/Duo y precios desalineados | Se reemplaza por catálogo real, mensual/anual y grupos comerciales |
| Seeds demo | Seed base sólo Fabricio/María | Se agregan seeds comerciales sintéticos, protegidos y separados del seed histórico |
| Tests | Tests de lógica/coaching, sin matriz comercial | Se agregan tests deterministas del resolver y catálogo |

## Tablas y RLS afectadas

Las tablas nuevas comerciales son privadas por defecto. El cliente autenticado sólo puede leer su propio resumen de billing y sus checkout intents; suscripciones, grants, eventos, mappings y contadores no son editables desde browser. La resolución efectiva se ejecuta mediante `security definer` y siempre usa `auth.uid()` en la variante pública.

Las tablas existentes de Household y Coaching ya tienen políticas específicas. Esta fase no las abre globalmente: la autorización de una operación debe combinar relación activa, capacidad efectiva y ownership del recurso.

## Entitlement model

- Booleanos: unión lógica OR.
- Cuotas: máximo aplicable, nunca suma de fuentes.
- `history_days = -1`: ilimitado.
- `progress_ranges`: unión.
- El patrocinio de Household/Coaching entrega beneficios personales explícitos, pero no derechos de creación de Household/Coaching.
- Sin suscripción o grant activo se resuelve `FREE_PERSONAL`.

## Deuda previa a cobro real

1. Aplicar gates server-side a cada mutación premium (AI, custom food/exercise, exports y versiones).
2. Completar enforcement de historial/rangos en queries, no sólo en UI.
3. Completar end-to-end Coach Starter y sus límites por RPC.
4. Crear y probar Edge Functions reales de Mercado Pago con documentación vigente del provider.
5. Correr el seed comercial sólo en proyecto local/staging allowlisted.
6. Agregar integración/RLS tests contra una base Supabase real.

## Alcance explícitamente diferido

- Red publicitaria, slots y serving.
- Targeting, consentimiento y métricas publicitarias operativas.
- Add-ons Household + Coach.
- Coach Studio.
- Checkout de producción y credenciales reales de Mercado Pago.

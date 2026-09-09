# Guía de estudio del repositorio `retail-micro-dollar-exchange`

## 1. Objetivo de este documento

Este documento explica cómo está organizado el repositorio, qué responsabilidad tiene cada capa y cómo fluye una consulta de ventana horaria y cotización desde la aplicación hasta la UI.

Está pensado como material de estudio y como guía para conversar con un líder técnico sobre:

- arquitectura del MFE;
- responsabilidades de cada módulo;
- integración con `@bnc/retail-pkg-api`;
- uso de Zustand y SWR;
- estrategia de testing y coverage;
- decisiones actuales y próximos pasos.

## 2. Resumen ejecutivo

El repositorio es un workspace Nx/Yarn que contiene:

```text
apps/
  main-app/                 Aplicación Expo usada para levantar y probar el MFE.

packages/
  dollar-exchange/          Feature principal de compra/venta de dólares.
  feature-example/          Feature de ejemplo del workspace.
```

El flujo implementado actualmente cubre:

1. Consulta de la ventana horaria del mercado.
2. Determinación de mercado abierto/cerrado.
3. Consulta de cotización para compra y venta.
4. Persistencia de estado normalizado en Zustand.
5. Presentación de rates en el hub.
6. Estados de loading, error, mercado cerrado y cotización no disponible.

Todavía no se implementa el flujo financiero completo:

- consulta de cuentas reales;
- validación de elegibilidad;
- compra;
- venta;
- transacción;
- términos y condiciones;
- confirmación real;
- comprobantes;
- actualización de saldo.

## 3. Arquitectura general

```text
apps/main-app
  ↓
DollarHubContainer
  ↓
useDollarExchangeHub
  ├─ useMarketHours()       @bnc/retail-pkg-api
  └─ useCurrencyQuote()     @bnc/retail-pkg-api
  ↓
Zustand: useDollarExchangeStore
  ↓
DollarHubScreen
  ↓
DollarAccessCard
```

La dependencia ideal entre capas es:

```text
presentation → application → domain
                         ↘ infrastructure/pkg-api
application → store
```

### Reglas de diseño

- La UI no conoce detalles de HTTP.
- El dominio no importa React, SWR ni Zustand.
- Zustand no ejecuta requests.
- `@bnc/retail-pkg-api` es responsable de HTTP, autenticación y SWR.
- Los datos internos se mantienen normalizados y los strings formateados se generan solamente para presentación.
- Las pantallas de compra y venta todavía son principalmente prototipos visuales y quedarán para una etapa posterior.


## 5. Aplicación principal: `apps/main-app`

### `apps/main-app/app/index.tsx`

Es la primera pantalla del MFE. Actualmente monta `DollarHubContainer`:

```tsx
<DollarHubContainer
  availableBalance="USD 15.000,00"
  onBackPress={() => router.back()}
  onBuyPress={() => router.push('/buy')}
  onSellPress={() => router.push('/sell')}
/>
```

El saldo todavía es de demostración. Los rates ya no se pasan hardcodeados: vienen desde la integración con `pkg-api`.

### `apps/main-app/app/_layout.tsx`

Configura providers generales:

- `UIProvider` del paquete UI común;
- `SafeAreaProvider`;
- navegación Expo Router;
- ocultamiento del header nativo.

### `apps/main-app/.env.development`

Configura el host base de la API para desarrollo:

```env
EXPO_PUBLIC_BASE_PROTOCOL=https
EXPO_PUBLIC_BASE_HOST=mobile.midev.bancor.com.ar
```

El paquete `@bnc/common-pkg-api-utils` utiliza estas variables para construir la URL base.

Sin estas variables, `getApiBaseUrl()` devuelve una cadena vacía y las requests pueden terminar contra el servidor de Expo/Web, devolviendo el `index.html` en lugar de JSON.

No se deben guardar tokens, cookies ni credenciales en estos archivos.

## 6. Paquete `dollar-exchange`

### `src/index.ts`

Es el entry point público del paquete. Reexporta:

- `shared`;
- application hooks;
- dominios de market hours y quotes;
- adapters de infraestructura;
- store;
- hub;
- buy;
- sell.

La aplicación principal importa desde este entry point:

```ts
import { DollarHubContainer } from '@org/dollar-exchange'
```

### Dominios

#### `src/domains/market-hours`

Contiene reglas puras relacionadas con el horario del mercado.

Archivos principales:

- `marketHours.types.ts`;
- `marketHours.utils.ts`;
- `marketHours.utils.test.ts`.

Responsabilidades:

- normalizar `IMarketHoursResponse`;
- interpretar horarios con offset como `-03:00`;
- evaluar si el mercado está abierto;
- soportar horarios que cruzan medianoche;
- formatear el horario para la UI.

La función importante es:

```ts
isMarketOpen(now, marketHours)
```

El reloj se recibe como parámetro para que la función sea determinista y fácil de testear.

#### `src/domains/quote`

Contiene reglas puras de cotización.

Archivos:

- `quote.types.ts`;
- `quote.utils.ts`;
- `quote.utils.test.ts`.

Define:

- `ExchangeRate`;
- `ExchangeQuotes`;
- `BUY_QUOTE_REQUEST`;
- `SELL_QUOTE_REQUEST`;
- `mapCurrencyQuote`;
- `formatExchangeRate`.

Los pares actuales son:

```ts
ARS → USD // compra de dólares
USD → ARS // venta de dólares
```

La cotización se mantiene como número y metadata. No se guarda solamente como `"$1.411,00"` porque ese string no sirve para construir una operación financiera futura.

### Application

#### `src/application/useDollarExchangeHub.ts`

Es el hook de orquestación del hub.

Responsabilidades:

1. Invocar `useMarketHours`.
2. Actualizar Zustand con loading/error/resultado.
3. Normalizar la ventana horaria.
4. Evaluar si el mercado está abierto.
5. Evitar cotizar cuando el mercado está cerrado.
6. Solicitar una cotización de compra y una de venta.
7. Guardar rates normalizados en Zustand.
8. Exponer retry de market hours y retry de cotizaciones.
9. Convertir errores desconocidos a `Error`.

La API devuelve hooks basados en SWR. Este hook funciona como frontera entre esos hooks y la UI.

### Infrastructure

#### `src/infrastructure/currencyExchange/currencyExchange.adapters.ts`

Adapta contratos externos de `@bnc/retail-pkg-api` a tipos internos del MFE.

Esto evita que toda la aplicación quede acoplada a nombres externos como:

- `IMarketHoursResponse`;
- `ICurrencyQuoteResponse`;
- `sellExchangeRate`.

Si el contrato externo cambia, idealmente se modifica este adapter y no todas las pantallas.

### Store

#### `src/store/useDollarExchangeStore.ts`

Es el store Zustand del flujo de currency exchange.

Guarda:

```ts
market: {
  status,
  hours,
  error,
}

quotes: {
  status,
  buy,
  sell,
  error,
}
```

Estados de mercado:

```text
idle
loading
open
closed
error
```

Estados de cotización:

```text
idle
loading
ready
partial
error
```

El store no llama a la API. Las requests viven en `useDollarExchangeHub`.

Esto es importante porque Zustand representa estado de aplicación, mientras que SWR representa cache/estado de requests.

## 7. Hub

### `DollarHubContainer.tsx`

Es el container de aplicación.

Responsabilidades:

- consumir `useDollarExchangeHub`;
- convertir rates a props visuales;
- convertir horario a texto;
- conectar callbacks de navegación;
- deshabilitar los controles de desarrollo.

No contiene JSX complejo de estados de negocio.

### `DollarHubScreen.tsx`

Es la pantalla de presentación del hub.

Renderiza:

- loading;
- normal/open;
- service failure;
- no account/outside hours legacy;
- outside hours;
- cards de compra y venta;
- controles de desarrollo cuando están habilitados.

Los controles internos siguen disponibles para desarrollo y tests, pero el container real los monta con:

```tsx
showStateControls={false}
```

### `DollarHubStateContent.tsx`

Contiene la presentación de los estados del hub, extraída para reducir la complejidad cognitiva de `DollarHubScreen`.

Incluye componentes como:

- balance card;
- outside hours card;
- service failure card;
- contenido normal.

### `DollarAccessCard.tsx`

Componente visual reutilizable de acceso a compra/venta.

Recibe:

- label;
- description;
- icon;
- disabled;
- onPress;
- testID.

No conoce API ni Zustand.

## 8. Buy y Sell

Los dominios `buy` y `sell` contienen las pantallas futuras de operación.

La integración financiera completa todavía no está implementada. Actualmente contienen prototipos visuales para:

- selección de cuenta;
- ingreso de monto;
- cálculo visual;
- confirmación;
- pre-ticket.

### `AccountSelector.tsx`

Muestra:

- nombre de cuenta;
- número;
- balance;
- callback de apertura del drawer.

Es puramente presentacional.

### `AccountDrawer.tsx`

Permite seleccionar una cuenta.

Responsabilidades actuales:

- mostrar cuentas;
- mantener selección temporal;
- confirmar selección;
- informar la cuenta elegida.

Todavía no consulta cuentas reales.

### `BuyDollarsScreen.tsx`

Orquesta el estado local del formulario de compra:

- cuenta seleccionada;
- monto ingresado;
- moneda de entrada;
- cálculo de monto derivado;
- validación de mínimo/máximo;
- navegación al siguiente paso.

La UI de cada estado fue extraída a:

```text
BuyDollarsStateContent.tsx
```

### `SellDollarsScreen.tsx`

Equivalente para venta:

- cuenta seleccionada;
- monto en dólares o pesos;
- cálculo del crédito;
- validación de monto;
- estado sin cuenta;
- estado fuera de horario.

La UI fue extraída a:

```text
SellDollarsStateContent.tsx
```

### Confirmation screens

- `BuyConfirmationScreen.tsx` muestra los detalles de compra y botones de confirmar/cancelar.
- `SellConfirmationScreen.tsx` muestra datos de venta y términos y condiciones.

Estas pantallas todavía no ejecutan `useExchangeTransaction`.

### Pre-ticket screens

- `BuyPreTicketScreen.tsx` representa resultado exitoso o error de compra.
- `SellPreTicketScreen.tsx` representa resultado exitoso o error de venta.

La presentación está separada en:

- `BuyPreTicketStateContent.tsx`;
- `SellPreTicketStateContent.tsx`.

Los tipos compartidos están en:

- `BuyPreTicket.types.ts`;
- `SellPreTicket.types.ts`.

Esta separación evita ciclos de imports entre la pantalla y su contenido.

## 9. Integración con `@bnc/retail-pkg-api`

La dependencia correcta es:

```text
@bnc/retail-pkg-api@1.4.0-rc.70
```

No se utiliza `@bnc/corporate-pkg-api` porque pertenece a otro dominio.

Hooks usados:

```ts
useMarketHours()
useCurrencyQuote()
```

Hook disponible para la próxima etapa:

```ts
useExchangeTransaction()
```

### Market hours

`useMarketHours` devuelve:

- `marketHours`;
- `isLoading`;
- `isError`;
- `isValidating`;
- `refetch`.

### Currency quote

`useCurrencyQuote` funciona como mutación:

```ts
trigger({ body: request })
```

Actualmente se solicita una cotización para compra y otra para venta.

### Autenticación

El paquete API utiliza `RequestConfigManager`.

En React Native espera un token configurado previamente. En web puede usar cookies de sesión.

Actualmente el MFE tiene resuelta la URL base mediante `.env.development`, pero la integración de sesión/token todavía queda pendiente.

## 10. Flujo completo del hub

```text
main-app/index.tsx
  ↓
DollarHubContainer
  ↓
useDollarExchangeHub
  ↓
useMarketHours
  ↓
loading
  ↓
normalizar horario
  ↓
¿mercado abierto?
  ├─ no → estado outsideHours
  └─ sí
       ↓
       solicitar quote compra + quote venta
       ↓
       guardar rates en Zustand
       ↓
       renderizar cards
```

Si falla `market-hours`:

```text
serviceFailure + retry
```

Si falla una cotización:

```text
quote partial/error + retry quote
```

## 11. Testing

### Configuración

`packages/dollar-exchange/jest.config.js` define:

- preset `jest-expo`;
- transform de dependencias React Native;
- setup global de mocks;
- exclusión de barrels `index.ts`;
- exclusión de `i18n.config.ts`, que contiene inicialización global de i18next;
- threshold global del 90%.

### Setup

<ref_file file="/Users/usuario/Desktop/Bancor/1027-retail-micro-dollar-exchange/packages/dollar-exchange/jest.setup.js" />

Centraliza mocks de:

- UI kit;
- Drawer;
- NumberInput;
- PreticketScreen;
- TermsAndConditions;
- safe area.

### Tipos de tests

#### Tests de dominio

Prueban funciones puras:

- horarios;
- offsets;
- medianoche;
- rates;
- formateo.

#### Tests de store

Prueban transiciones de Zustand sin renderizar UI.

#### Tests de application hook

Mockean `@bnc/retail-pkg-api` y validan:

- loading;
- mercado abierto;
- mercado cerrado;
- errores;
- retry;
- cotización parcial;
- doble cotización.

#### Tests de presentación

Se colocan junto a cada componente/pantalla y cubren estados y acciones visibles.

## 12. Coverage y Sonar

El coverage actual supera el threshold global:

```text
Statements: 97.23%
Branches:   91.82%
Functions:  98.40%
Lines:      97.93%
```

Última ejecución:

```text
19 test suites passed
66 tests passed
```

Las excepciones de coverage se limitan a archivos sin comportamiento ejecutable relevante:

- barrels `index.ts`;
- configuración global de i18next.

No se excluyen:

- Buy screens;
- Sell screens;
- AccountDrawer;
- Hub;
- Pre-ticket;
- adapters;
- store.

## 13. Variables y secretos

Nunca versionar:

- tokens;
- certificados;
- archivos `.env` locales;
- cookies;
- credenciales.

Los certificados locales se mantienen fuera del repositorio mediante `.gitignore`:

```gitignore
/apps/main-app/certs/
```

El script de sincronización de certificados es:

```text
scripts/sync-certs.sh
```

La URL base de desarrollo se configura mediante variables `EXPO_PUBLIC_*`.

## 14. Qué está fuera de alcance

La siguiente etapa debería agregar:

1. consulta de cuentas;
2. detección de cuenta en dólares;
3. validación de elegibilidad;
4. persistencia de cuenta seleccionada en Zustand;
5. construcción del request financiero;
6. términos y condiciones reales;
7. `useExchangeTransaction`;
8. confirmación;
9. receiptId;
10. actualización de saldo.

La base actual está preparada para incorporar estas capacidades sin llevar requests HTTP directamente a los componentes visuales.

## 15. Preguntas para conversar con el líder técnico

1. ¿La cotización debe refrescarse solamente al entrar al hub o también al regresar desde compra/venta?
2. ¿Qué vigencia tiene `quoteDate`?
3. ¿Compra y venta requieren realmente dos pares de monedas?
4. ¿Qué endpoint determina la existencia de una cuenta en dólares?
5. ¿Dónde debe inicializarse el token de `RequestConfigManager`?
6. ¿Zustand debe persistir entre navegación o solo durante la sesión del MFE?
7. ¿Qué estados deben ser productivos y cuáles son solamente de playground?
8. ¿El flujo de transacción debe vivir en este paquete o en un container de la aplicación host?
9. ¿Cómo se actualiza el saldo luego de una operación exitosa?
10. ¿Qué estrategia de retry se permite para errores de cotización y de transacción?

## 16. Comandos útiles

```bash
source ~/.zshrc

# Instalar dependencias
yarn install

# Ejecutar la app
yarn start

# Tests del paquete
yarn nx run @org/dollar-exchange:test

# Tests con coverage
yarn nx run @org/dollar-exchange:test --coverage

# Coverage sin cache
yarn nx run @org/dollar-exchange:test --runInBand --coverage --skipNxCache

# TypeScript
yarn type-check

# Lint
yarn nx run @org/dollar-exchange:lint --skipNxCache

# Formato
yarn nx run @org/dollar-exchange:format --configuration=check --skipNxCache

# Build
yarn nx build @bnc/retail-micro-dollar-exchange --skipNxCache
```

## 17. Cómo explicar el proyecto en una reunión

Una explicación breve podría ser:

> Este es un MFE React Native/Expo dentro de un workspace Nx. La aplicación host monta un container del hub. El container usa un hook de aplicación que consume `useMarketHours` y dos instancias de `useCurrencyQuote` desde `@bnc/retail-pkg-api`. Las respuestas externas se adaptan a modelos internos, se guardan en Zustand y se entregan a componentes presentacionales. El dominio contiene funciones puras para interpretar horarios y rates. Los tests se separan por dominio, store, application hook y presentación. La compra y venta real todavía no ejecutan transacciones; esta etapa prepara el estado y la arquitectura para incorporarlas después.

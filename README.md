# Contract testing con Pact: BibliotecaWeb y BibliotecaAPI

Proyecto para la tarea de compatibilidad entre consumidor y proveedor usando Pact. Es un caso pequeño de una biblioteca: la aplicación web (consumidor) consulta un libro por su id a la API (proveedor) y muestra si hay copias disponibles o si el libro no existe.

- **Consumidor:** `BibliotecaWeb`, módulo cliente en [src/consumer/bookClient.ts](src/consumer/bookClient.ts). La clase `BookClient` hace la petición con axios y la función `describeBook` arma el texto que ve el usuario.
- **Proveedor:** `BibliotecaAPI`, API Express en [src/provider/app.ts](src/provider/app.ts) con el endpoint `GET /books/:id`.
- **Contrato generado:** [pacts/BibliotecaWeb-BibliotecaAPI.json](pacts/BibliotecaWeb-BibliotecaAPI.json). Lo crean las pruebas del consumidor, no está escrito a mano.

## Requisitos y versiones

Probado en Windows 11 con estas versiones:

| Herramienta | Versión |
|---|---|
| Node.js | 24.18.0 (sirve 20 o superior) |
| npm | 11.16.0 |
| TypeScript | 5.9.3 |
| @pact-foundation/pact | 17.1.4 (pact-core 20.2.0) |
| Jest / ts-jest | 30.5.2 / 29.4.15 |
| Express | 5.3.0 |
| axios | 1.21.0 |
| Git | necesario para aplicar el cambio incompatible |

No se necesita Pact Broker, base de datos ni ninguna cuenta. No hay credenciales en el proyecto.

## Instalación

```bash
git clone https://github.com/AugustoReyes21/contract-testing-pact-biblioteca.git
cd contract-testing-pact-biblioteca
git checkout v1.0.0
npm install
```

Pact descarga su librería nativa como dependencia opcional (`@pact-foundation/pact-core-windows-x64`, `-linux-x64`, `-darwin-arm64`, etc.), así que no hay que instalar nada aparte.

## Interacciones del contrato

| | Interacción exitosa | Interacción alternativa |
|---|---|---|
| Precondición (provider state) | `existe el libro con id 1` | `no existe el libro con id 999` |
| Solicitud | `GET /books/1` con `Accept: application/json` | `GET /books/999` con `Accept: application/json` |
| Respuesta esperada | `200` con `id`, `title`, `author`, `isbn` y `availableCopies` | `404` con un campo `message` de tipo texto |
| Qué hace el consumidor | Devuelve el libro y muestra "disponible (3 copias)" | Devuelve `null` y muestra "Libro no encontrado" |

Matchers usados: `integer` para `id` y `availableCopies` (el consumidor hace cuentas con ese número), `string` para título y autor, `regex` de 13 dígitos para el `isbn`, `regex` para el `Content-Type` y `like` para el mensaje del 404 (solo importa que sea texto).

## Comandos

Generar el contrato (pruebas del consumidor):

```bash
npm run test:consumer
```

Esto borra la carpeta `pacts/`, ejecuta el `BookClient` real contra el mock server de Pact, comprueba con assertions cómo interpreta cada respuesta y, si todo pasa, escribe `pacts/BibliotecaWeb-BibliotecaAPI.json`.

Verificar el contrato contra el proveedor:

```bash
npm run test:provider
```

Levanta la API real en un puerto libre, prepara cada provider state y reproduce las peticiones del contrato contra ella.

Las dos cosas seguidas:

```bash
npm test
```

Opcional, levantar la API a mano en `http://localhost:3000/books/1`:

```bash
npm run start:provider
```

## Preparación de estados

Los estados están en [test/provider/bookApi.pact.verify.test.ts](test/provider/bookApi.pact.verify.test.ts) dentro de `stateHandlers`:

- `existe el libro con id 1`: vacía el repositorio y guarda un libro con 5 copias totales y 2 prestadas (quedan 3 disponibles).
- `no existe el libro con id 999`: vacía el repositorio.

Pact ejecuta el handler antes de cada interacción y cada uno empieza limpiando los datos, por eso el resultado no depende del orden en que se verifiquen.

## Dependencias reales y simuladas

| Parte | En pruebas del consumidor | En verificación del proveedor |
|---|---|---|
| Cliente `BookClient` (axios) | Real | No participa |
| API del proveedor | Simulada por el mock server de Pact | Real (Express, rutas y mapeo de la respuesta) |
| Datos de libros | No aplica | Controlados: repositorio en memoria que llenan los provider states en lugar de una base de datos |

## Cambio incompatible

El cambio está guardado como parche en [breaking-change/romper-contrato.patch](breaking-change/romper-contrato.patch). Modifica `src/provider/app.ts` para que `availableCopies` se envíe como texto (`"3"`) en vez de número (`3`). El consumidor usa ese campo para comparar si es mayor que cero, así que este cambio lo rompería.

Para reproducirlo:

```bash
npm run test:consumer      # genera el contrato si no existe
npm run break:apply        # aplica el cambio incompatible
npm run test:provider      # falla
npm run break:revert       # deshace el cambio
npm run test:provider      # vuelve a pasar
```

Con el cambio aplicado Pact muestra:

```
1.1) has a matching body
       $.availableCopies -> Expected '3' (String) to be an integer
```

El parche nunca queda aplicado en la versión del repositorio. Si se olvida revertir, `git status` muestra `src/provider/app.ts` modificado y con `npm run break:revert` o `git checkout src/provider/app.ts` se arregla.

## Versión entregada

La versión entregada es la etiqueta `v1.0.0`.

## Alcance

El contrato solo revisa que consumidor y proveedor estén de acuerdo en la forma de las peticiones y respuestas. No reemplaza pruebas de las reglas internas del proveedor, por ejemplo cómo se calculan los préstamos.

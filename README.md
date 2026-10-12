# Cuentas Claras

El código de Cuentas Claras tal como queda al final de la práctica de la Unidad 3 del curso **Idea to App: crea tu idea con IA sin saber programar**.

Andrea organiza los gastos de un viaje con sus amigos y quiere saber quién le debe a quién sin hacer cuentas a mano. En el video la construimos con Antigravity y desarrollo guiado por la especificación (spec-driven development): primero la spec, el plan y las tareas, y después una tarea a la vez, cada una con su commit. Al final la publicamos en Vercel.

## Qué hay aquí

- `specs/01-spec.md`, `specs/02-plan.md` y `specs/03-tareas.md`: la especificación, el plan y las 8 tareas del video.
- `AGENTS.md`: las reglas que el agente sigue en todo el proyecto.
- Un commit por tarea, en el mismo orden del video, y tres más del final (pruebas locales, imagen para compartir y Analytics).
- `tests/`: las pruebas del cálculo de saldos, del mensaje de WhatsApp y de las reglas de Firestore.
- `firebase/firestore.rules`: las reglas de seguridad.

## Verlo en vivo

https://cuentas-claras-swart.vercel.app es la versión de demostración del curso. Se construyó con la misma spec, así que puede verse un poco distinta de la del video.

## Correrlo en tu computadora

Necesitas Node.js.

```
npm install
npm test
```

`npm test` corre las pruebas de saldos y del mensaje de WhatsApp. `npm run test:rules` corre las de las reglas de Firestore y necesita Java 21.

Para usarla con tu propio Firebase, copia `.env.example` a `.env` y llénalo con los valores de tu app web de Firebase. Después cambia el proyecto en `.firebaserc`: ahí quedó el proyecto que se usó para grabar, que ya no está activo. Luego corre:

```
npm run dev
```

Para probar sin Firebase, usa la base de datos de prueba local: `npm run emulators` en una terminal y `npm run dev:emulators` en otra.

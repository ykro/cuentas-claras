# Tareas: Cuentas Claras

Ocho tareas pequeñas, en orden. Cada una se termina por completo antes de empezar la siguiente.

**Cómo se verifica:** yo (el agente) corro los comandos; tú miras el resultado en el navegador y marcas la casilla solo si ves exactamente lo que dice la verificación. Al cerrar cada tarea hago un commit en git con su nombre.

**Fuera de esta lista:** publicar en Vercel. Lo haces tú al final, siguiendo la sección 7 del plan.

---

## Datos de prueba (se usan en las tareas 5, 6, 7 y 8)

Grupo **"Viaje a Antigua"** con 4 personas: **Yo** (la organizadora, primera de la lista), **Carlos**, **Beto** y **Luisa**.

| Gasto | Monto | Pagó | Cómo se divide | A cada uno le toca |
|---|---|---|---|---|
| Hospedaje | $180.00 | Yo | Partes iguales (todos) | Yo $45, Carlos $45, Beto $45, Luisa $45 |
| Cena del viernes | $54.00 | Carlos | Solo algunos (sin Beto) | Yo $18, Carlos $18, Luisa $18 |
| Gasolina | $40.00 | Luisa | Montos exactos | Yo $10, Carlos $10, Beto $15, Luisa $5 |

**Resultado esperado:**

- Total gastado: **$274.00**
- Arriba dice: **Te deben $107.00**
- Saldos: Yo **+$107.00** (verde) · Carlos **−$19.00** · Beto **−$60.00** · Luisa **−$28.00** (los tres en rojo suave)
- Quién le paga a quién (3 pagos): **Beto → Yo $60.00** · **Luisa → Yo $28.00** · **Carlos → Yo $19.00**

---

## Tarea 1 — Base del proyecto

- [x] **Hecho**
- **Qué hace:** crea el proyecto con React, Vite y Tailwind, inicializa git y muestra un aviso mientras Firebase no esté conectado.
- **Crea:** `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/lib/firebase.js` (solo revisa si hay configuración), `.env.example` (lista de variables, sin valores), `.gitignore` (incluye `.env` y `node_modules`) y el repositorio git con un primer commit.
- **Verificación:** corro `npm run dev`, abres http://localhost:5173 y ves en fondo claro el título **Cuentas Claras** y el aviso **"Falta conectar Firebase"** (porque `.env` está vacío); además te muestro que `git log` tiene el primer commit.

---

## Tarea 2 — Cálculo de saldos y pruebas

- [x] **Hecho**
- **Qué hace:** escribe el motor de cuentas en centavos (reparto de cada gasto, saldo de cada persona, mínimo de pagos) y sus pruebas automáticas, sin pantallas todavía.
- **Crea:** `src/lib/balances.js` y `tests/balances.test.js` (con los datos de prueba de arriba, `$10.00` entre 3 = `$3.34`, `$3.33`, `$3.33`, el caso "Ana le debe a Luis y Luis a Carla = un solo pago de Ana a Carla", un pago registrado que mueve los saldos y el bloqueo para quitar a una persona con movimientos).
- **Verificación:** corro `npx vitest --ui tests/balances.test.js`, se abre la página de pruebas en el navegador y ves todas en verde (0 fallidas), incluida la que comprueba **Yo +$107.00, Carlos −$19.00, Beto −$60.00, Luisa −$28.00** y los 3 pagos **Beto → Yo $60.00, Luisa → Yo $28.00, Carlos → Yo $19.00**.

---

## Tarea 3 — Preparar Firebase

- [x] **Hecho**
- **Qué hace:** conecta el proyecto con Firebase (plan Spark gratuito), activa el inicio de sesión con Google, crea la base de datos Firestore `(default)`, llena `.env` y publica las reglas de seguridad.
- **Crea:** `.env` (con las claves públicas de Firebase; nunca se sube a git), `.firebaserc`, `firebase.json` y `firestore.rules` (copiadas tal cual de la sección 4 del plan); agrega `firebase-tools` a `package.json`. Tú solo haces los clics que pida la consola de Firebase (crear proyecto y activar Google).
- **Verificación:** corro `npx firebase deploy --only firestore:rules` y recargo http://localhost:5173: el aviso **"Falta conectar Firebase"** ya no aparece; en la consola de Firebase, en Firestore → Reglas, ves las reglas publicadas con la fecha de hoy, y te muestro que `git status` no lista `.env`.

---

## Tarea 4 — Inicio de sesión con Google

- [x] **Hecho**
- **Qué hace:** pantalla de bienvenida con un solo botón, entrada con Google, pantalla "Mis grupos" vacía y botón para cerrar sesión.
- **Crea:** `src/components/Welcome.jsx` y `src/components/GroupsScreen.jsx` (vacía por ahora); amplía `src/lib/firebase.js` (entrar y salir con Google) y `src/App.jsx` (elige qué pantalla mostrar según la sesión).
- **Verificación:** en http://localhost:5173 ves **Cuentas Claras** con el botón **"Continuar con Google"**; al elegir tu cuenta llegas a **"Mis grupos"** vacía con el botón **"Nuevo grupo"**; al recargar la página sigues dentro, y al tocar **"Cerrar sesión"** vuelves a la bienvenida.

---

## Tarea 5 — Grupos y personas

- [ ] **Hecho**
- **Qué hace:** crear, editar y borrar grupos; agregar, renombrar y quitar personas, cada una con su `id` fijo. La organizadora es siempre la primera persona del grupo.
- **Crea:** `src/components/GroupForm.jsx`; completa `src/components/GroupsScreen.jsx` (lista de grupos) y agrega a `src/lib/firebase.js` las funciones para guardar y borrar grupos (el borrado elimina también sus gastos y pagos).
- **Verificación:** creas **"Viaje a Antigua"** con **Yo, Carlos, Beto, Luisa** y la lista muestra **"Viaje a Antigua · 4 personas · $0.00"**; un grupo con solo **Yo** o con **Carlos** repetido no se deja guardar y explica por qué; renombras **Carlos → Carlitos**, guardas y lo regresas a **Carlos**; creas **"Grupo de prueba"** con **Ana** y **Luis**, lo borras tras confirmar y desaparece; al recargar, **"Viaje a Antigua"** sigue ahí.

---

## Tarea 6 — Gastos

- [ ] **Hecho**
- **Qué hace:** pantalla del grupo con su total y la pestaña **Gastos**; anotar, editar y borrar gastos con las tres formas de división.
- **Crea:** `src/components/GroupDetail.jsx` (encabezado, total y pestañas) y `src/components/ExpenseForm.jsx`; agrega a `src/lib/firebase.js` las funciones para guardar y borrar gastos.
- **Verificación:** en **"Viaje a Antigua"** anotas los 3 gastos de los datos de prueba (**Hospedaje $180** pagado por Yo entre todos, **Cena del viernes $54** pagada por Carlos sin Beto, **Gasolina $40** pagada por Luisa con montos exactos); si en Gasolina pones Luisa $0 ves **"Faltan $5.00"** y no se guarda hasta poner $5; el encabezado muestra **$274.00**; editas Gasolina a $41 (total **$275.00**) y la regresas a $40; anotas **"Chicle $1"**, lo borras y vuelve a **$274.00**; al intentar quitar a **Beto** del grupo, te avisa que primero hay que ajustar sus gastos.

---

## Tarea 7 — Saldos, pagos y WhatsApp

- [ ] **Hecho**
- **Qué hace:** pestaña **Saldos** con "Te deben", saldo por persona en verde o rojo suave, "Quién le paga a quién", marcar pagos (y deshacerlos) y enviar el resumen por WhatsApp o copiarlo.
- **Crea:** `src/components/BalancesView.jsx` y `src/lib/whatsapp.js` (arma el mensaje y el enlace `wa.me`); agrega a `src/lib/firebase.js` las funciones para guardar y borrar pagos, y los pagos aparecen en la pestaña Gastos.
- **Verificación:** arriba dice **Te deben $107.00**; ves **Yo +$107.00** en verde y **Carlos −$19.00, Beto −$60.00, Luisa −$28.00** en rojo suave; "Quién le paga a quién" muestra exactamente **Beto → Yo $60.00, Luisa → Yo $28.00, Carlos → Yo $19.00**; al marcar pagado el de Beto, arriba cambia a **Te deben $47.00**, Beto queda **A mano $0.00** y en Gastos aparece **"Pago Beto → Yo $60.00"**; al deshacerlo vuelve a **$107.00**; **"Enviar por WhatsApp"** abre WhatsApp con el texto que incluye **Viaje a Antigua**, **Total: $274.00** y los 3 pagos.

---

## Tarea 8 — Revisión final en el celular y reglas

- [ ] **Hecho**
- **Qué hace:** deja la app instalable en el celular, la revisa con el pulgar en un teléfono real y prueba las reglas de seguridad con el emulador local de Firebase (Java 21).
- **Crea:** `public/manifest.webmanifest`, `public/icon.svg` y `tests/firestore.rules.test.js` (los 8 casos de la sección 6.2 del plan); enlaza el manifiesto en `index.html`. Para abrirla desde el celular agrego la IP de tu computadora a los dominios autorizados de Firebase Authentication. Si alguna prueba obliga a corregir `firestore.rules`, vuelvo a publicarlas con `npx firebase deploy --only firestore:rules`.
- **Verificación:** corro `npx firebase emulators:exec --only firestore "npx vitest run tests/firestore.rules.test.js"` y te muestro el resumen con todas las pruebas aprobadas y 0 fallidas; luego corro `npm run dev -- --host`, abres en tu celular (misma red wifi) la dirección que te doy, entras con Google, ves **"Viaje a Antigua"** con **Te deben $107.00** legible sin hacer zoom y un solo botón principal por pantalla, la agregas a la pantalla de inicio con el ícono de **Cuentas Claras**, y en una ventana privada de la computadora, entrando con otra cuenta de Google, **"Viaje a Antigua"** no aparece.


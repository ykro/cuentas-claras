# Lista de Tareas de Construcción: Cuentas Claras (v1 - MVP)

Este documento contiene la secuencia paso a paso de las 8 tareas necesarias para construir y probar la aplicación **Cuentas Claras**. Cada tarea está pensada para ser pequeña, verificable visualmente en el navegador y con datos concretos del mundo real.

*(Nota: La publicación final en Vercel la realiza la usuaria al concluir las 8 tareas).*

---

### - [x] Tarea 1: Base del proyecto e inicialización
* **Objetivo:** Crear el esqueleto de la aplicación web, preparar el control de versiones con Git y configurar el aviso preventivo de conexión.
* **Archivos que crea o modifica:**
  * `package.json`
  * `vite.config.js`
  * `tailwind.config.js`
  * `postcss.config.js`
  * `index.html`
  * `src/main.jsx`
  * `src/App.jsx`
  * `src/index.css`
  * `.gitignore`
  * `.env.example`
  * `.env` (creado inicialmente vacío)
* **Qué hace:**
  1. Inicializa el repositorio local de Git (`git init`).
  2. Inicializa el proyecto con Vite (React + JavaScript), Tailwind CSS y Lucide Icons.
  3. Configura una pantalla de bienvenida limpia con estética bancaria.
  4. Agrega un detector en el inicio: si el archivo `.env` no tiene configuradas las claves de Firebase, muestra un aviso claro y visible con fondo suave: *"Falta conectar Firebase"*.
* **Cómo verificarla sin saber programar:**  
  Yo inicio el servidor con `npm run dev`, tú abres `http://localhost:5173` en tu navegador y ves la pantalla con el logotipo de Cuentas Claras y un aviso visible que dice claramente **"Falta conectar Firebase"**.

---

### - [x] Tarea 2: Algoritmo de saldos, deudas y pruebas unitarias
* **Objetivo:** Implementar la lógica matemática que calcula cuánto debe cada persona, resuelve las 3 modalidades de división y minimiza las transferencias necesarias.
* **Archivos que crea o modifica:**
  * `src/utils/debtSimplifier.js`
  * `src/utils/formatters.js`
  * `src/utils/whatsappFormatter.js`
  * `tests/debtSimplifier.test.js`
  * `tests/whatsappFormatter.test.js`
* **Qué hace:**
  1. Programa la función de balance neto individual: $\text{Balance} = \text{Total pagado} - \text{Total consumido}$.
  2. Implementa las 3 divisiones: partes iguales generales, partes iguales para un subgrupo, y montos exactos asignados.
  3. Implementa el algoritmo voraz (*greedy*) que empareja al mayor deudor con el mayor acreedor hasta liquidar todas las deudas con el mínimo de pagos.
  4. Escribe el formateador de texto listo para WhatsApp con saltos de línea legibles.
  5. Configura Vitest y escribe pruebas automatizadas utilizando este escenario real del viaje con 4 personas (María/Tú, Carlos, Beto y Luisa):
     * *Gasto 1:* Hospedaje por **$180.00** pagado por ti dividido entre todos ($45 c/u).
     * *Gasto 2:* Cena del viernes por **$54.00** pagada por Carlos dividido solo entre María, Carlos y Luisa ($18 c/u, Beto no participó).
     * *Gasto 3:* Gasolina por **$40.00** pagada por Luisa con montos exactos: María $10, Luisa $15, Carlos $10 y Beto $5.
* **Cómo verificarla sin saber programar:**  
  Yo ejecuto `npm test` en la terminal y tú ves en pantalla que todas las pruebas pasan en verde (✓), confirmando que tu balance neto resultante es exactamente **+$107.00** ("Te deben $107.00"), que Beto debe $50.00, Luisa debe $38.00 y Carlos debe $19.00.

---

### - [ ] Tarea 3: Configuración local de Firebase y despliegue de reglas
* **Objetivo:** Instalar las herramientas de Firebase dentro del proyecto, configurar las claves en `.env`, blindar la base de datos con reglas de seguridad y desplegarlas a la nube.
* **Archivos que crea o modifica:**
  * `firebase.json`
  * `.firebaserc`
  * `firebase/firestore.rules`
  * `src/services/firebase.js`
  * `tests/firestore.rules.test.js`
  * `.env` (con las credenciales de Firebase del proyecto Spark de la usuaria)
* **Qué hace:**
  1. Instala `firebase-tools` y `@firebase/rules-unit-testing` como dependencias de desarrollo (`devDependencies`).
  2. Configura `src/services/firebase.js` para inicializar Firebase Auth y Firestore `(default)` leyendo las variables de `.env`.
  3. Escribe las reglas de seguridad completas en `firebase/firestore.rules` con las 3 funciones de validación:
     * Grupos con al menos 2 personas (`participants.size() >= 2`).
     * Gastos con monto mayor a cero (`amount > 0`) y al menos un participante (`splits.size() >= 1`).
     * Pagos con monto mayor a cero y personas distintas (prohibido auto-pago: `fromParticipantId != toParticipantId`).
  4. Ejecuta las 8 pruebas de seguridad contra el emulador local.
  5. Despliega las reglas a la base de datos en la nube con `npx firebase deploy --only firestore:rules`.
* **Cómo verificarla sin saber programar:**  
  Yo corro las pruebas de reglas en el emulador y ves las 8 pruebas en verde en la consola; luego corro el despliegue a la nube y ves el mensaje final de Firebase: **"✔ Deploy complete! Ruleset updated"**.

---

### - [ ] Tarea 4: Inicio de sesión con Google (Firebase Auth)
* **Objetivo:** Permitir que la organizadora entre a la aplicación con su cuenta de Google con un solo clic y mantenga su sesión activa.
* **Archivos que crea o modifica:**
  * `src/context/AuthContext.jsx`
  * `src/components/AuthButton.jsx`
  * `src/components/Navbar.jsx`
  * `src/pages/LoginPage.jsx`
  * `src/App.jsx`
* **Qué hace:**
  1. Crea el contexto global de autenticación (`AuthContext`) que escucha el estado del usuario de Google.
  2. Construye la pantalla `LoginPage` con el botón prominente "Continuar con Google".
  3. Al iniciar sesión, guarda el perfil en la colección `users/{userId}` de Firestore y redirige a la vista principal.
  4. Muestra la barra superior (`Navbar`) con el título "Cuentas Claras", tu foto de perfil de Google, tu nombre y un botón discreto para cerrar sesión.
* **Cómo verificarla sin saber programar:**  
  Abres la app en el navegador, haces clic en el botón "Continuar con Google", seleccionas tu cuenta y ves de inmediato tu nombre y tu foto en la barra superior, desapareciendo el aviso de bienvenida.

---

### - [ ] Tarea 5: Creación y gestión de grupos y personas
* **Objetivo:** Permitir crear una salida o viaje agregando a las personas con sus nombres y asignándoles IDs únicos internos.
* **Archivos que crea o modifica:**
  * `src/services/groupsService.js`
  * `src/components/GroupCard.jsx`
  * `src/components/ParticipantList.jsx`
  * `src/pages/GroupsPage.jsx`
  * `src/pages/GroupDetailPage.jsx`
* **Qué hace:**
  1. Implementa las funciones de base de datos para crear, leer, actualizar y eliminar documentos en `groups/{groupId}`.
  2. Al crear un grupo, asigna automáticamente a la organizadora como primer participante con su propio ID y permite escribir los nombres de los amigos (cada uno recibe un `id` único).
  3. Valida en pantalla que el grupo tenga un nombre y al menos 2 personas antes de permitir guardar.
  4. Permite editar el nombre del grupo, agregar más personas, corregir nombres de participantes o eliminar el grupo con confirmación.
* **Cómo verificarla sin saber programar:**  
  Haces clic en "+ Nuevo Grupo", escribes "Viaje Fin de Semana" y agregas a "Carlos", "Beto" y "Luisa" (4 participantes en total); guardas y ves la tarjeta del viaje en tu lista; al hacer clic entras a la pantalla del viaje con tus 4 amigos listados.

---

### - [ ] Tarea 6: Registro de gastos con 3 tipos de división
* **Objetivo:** Registrar consumos con montos en dólares grandes y claros, seleccionando quién pagó y eligiendo entre las 3 opciones de reparto.
* **Archivos que crea o modifica:**
  * `src/services/expensesService.js`
  * `src/components/CurrencyInput.jsx`
  * `src/components/ExpenseForm.jsx`
  * `src/components/ExpenseList.jsx`
  * `src/pages/GroupDetailPage.jsx`
* **Qué hace:**
  1. Construye el formulario para anotar gastos con campo de dinero grande (`$ 0.00`) y selector de pagador.
  2. Permite elegir la forma de reparto:
     * *Todos por igual:* divide automáticamente entre los 4 participantes.
     * *Solo algunos:* muestra casillas para desmarcar personas que no participaron.
     * *Montos exactos:* muestra un campo para cada persona y valida que la suma coincida al centavo.
  3. Guarda los gastos en la subcolección `groups/{groupId}/expenses` asociando siempre los IDs de los participantes.
  4. Muestra la lista de gastos en la pestaña "Gastos" con el monto total acumulado arriba.
* **Cómo verificarla sin saber programar:**  
  En el grupo "Viaje Fin de Semana" anotas los 3 gastos del ejemplo:
  1. *Hospedaje:* $180.00, pagado por ti, dividido entre todos.
  2. *Cena del viernes:* $54.00, pagado por Carlos, desmarcando la casilla de Beto.
  3. *Gasolina:* $40.00, pagado por Luisa, escribiendo montos exactos ($10 a María, $15 a Luisa, $10 a Carlos y $5 a Beto).  
  Al terminar, ves los 3 gastos listados y arriba un total acumulado grande de **$274.00**.

---

### - [ ] Tarea 7: Pestaña de saldos, registro de pagos y WhatsApp
* **Objetivo:** Visualizar de inmediato quién le paga a quién, ver tu balance neto en verde, registrar abonos y abrir WhatsApp con el mensaje prellenado.
* **Archivos que crea o modifica:**
  * `src/services/settlementsService.js`
  * `src/components/SettlementList.jsx`
  * `src/components/WhatsAppButton.jsx`
  * `src/pages/GroupDetailPage.jsx`
* **Qué hace:**
  1. Construye la pestaña "Saldos y Pagos" en el detalle del grupo.
  2. Muestra arriba un indicador grande y llamativo: en verde **"Te deben $107.00"**.
  3. Muestra el bloque "Quién le paga a quién" con la lista de pagos mínimos requeridos:
     * *Beto le paga $50.00 a María*
     * *Luisa le paga $38.00 a María*
     * *Carlos le paga $19.00 a María*
  4. Cada instrucción de pago tiene un botón *"Marcar como pagado"*, que guarda la liquidación en Firestore y actualiza los saldos en tiempo real.
  5. Incluye el botón principal *"Compartir por WhatsApp"*, que genera el enlace `https://wa.me/?text=...` con el resumen ordenado del viaje.
* **Cómo verificarla sin saber programar:**  
  Entras a la pestaña "Saldos y Pagos", ves arriba en números grandes y verdes **"Te deben $107.00"**, y abajo los 3 pagos exactos. Haces clic en "Compartir por WhatsApp" y se abre WhatsApp en tu pantalla con el mensaje listo para enviar a tus amigos.

---

### - [ ] Tarea 8: Revisión final en el celular y reglas de seguridad
* **Objetivo:** Optimizar la experiencia táctil en celulares, configurar el acceso directo en pantalla de inicio (PWA) y ejecutar una auditoría final completa.
* **Archivos que crea o modifica:**
  * `public/manifest.json`
  * `public/icon-192.png`
  * `public/icon-512.png`
  * `index.html`
* **Qué hace:**
  1. Configura el manifiesto de la aplicación web para que se pueda "Añadir a la pantalla de inicio" del celular como una app nativa sin barras de navegación del explorador.
  2. Ajusta estilos, tamaños de botones y espaciados para pantallas móviles (360px a 430px) garantizando que no existan tarjetas anidadas y que haya una sola acción principal destacada por pantalla.
  3. Ejecuta la suite completa de pruebas unitarias y de reglas de seguridad de Firestore para confirmar 0 errores.
* **Cómo verificarla sin saber programar:**  
  Abres la app desde tu celular (o con el simulador móvil del navegador) y compruebas que se ve y siente como una aplicación bancaria limpia; al mismo tiempo, en la terminal ves el reporte final de pruebas con **100% de pruebas aprobadas en verde**.

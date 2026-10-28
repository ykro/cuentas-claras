# Plan Técnico de Construcción: Cuentas Claras (v1 - MVP)

Este documento detalla la arquitectura, el diseño de datos, las reglas de seguridad y la estrategia de despliegue para la aplicación **Cuentas Claras**.

---

## 1. Decisiones Técnicas (Explicadas para no programadores)

Cada decisión técnica tiene un motivo práctico pensado para que la aplicación sea rápida, segura y gratuita:

1. **React con Vite:** Permite que la aplicación responda al instante en el celular sin recargar la pantalla cada vez que tocas un botón.
2. **JavaScript (sin TypeScript):** Mantiene el código directo, sencillo de leer y fácil de modificar sin capas adicionales de complejidad.
3. **Tailwind CSS:** Es un sistema de diseño visual que permite crear la interfaz bancaria limpia y moderna en pocos pasos.
4. **Lucide React:** Paquete de íconos modernos y ligeros que cualquier persona reconoce intuitivamente (flechas, billetera, check, basurero).
5. **IDs únicos para cada persona:** Al asociar gastos a un código de identidad interno en vez de su nombre, puedes corregir "Cárlos" por "Carlos" sin que se borre ni se descuadre ningún gasto.
6. **Google Sign-In (Firebase Authentication):** Permite que entres con un solo toque usando tu cuenta de Google segura, sin tener que inventar ni recordar contraseñas.
7. **Cloud Firestore (Base de datos en la nube):** Es como un archivador digital seguro en los servidores de Google que guarda tus datos al instante y es gratis para el uso personal.
8. **Herramientas de Firebase locales (`npx firebase`):** Se instalan dentro de la carpeta del proyecto para no alterar ni ensuciar la configuración de tu computadora.
9. **Enlace directo a WhatsApp (`wa.me`):** Abre la conversación de WhatsApp en tu teléfono con el texto ya escrito sin pagar servicios externos ni configurar servidores.
10. **Vitest y Emulador local:** Son "asistentes de control de calidad" que hacen simulaciones en tu computadora para verificar que las matemáticas de las deudas y la seguridad sean 100% exactas antes de que nadie las use.
11. **Vercel + GitHub a costo cero:** GitHub guarda el historial de tu proyecto y Vercel publica la web en internet de forma automática y gratuita cada vez que guardas una mejora.

---

## 2. Estructura de Carpetas del Proyecto

El proyecto tendrá una distribución ordenada para separar la interfaz de usuario, la lógica de cálculos y la conexión con la base de datos:

```text
cuentas-claras/
├── .github/                      # Automatizaciones para pruebas
├── firebase/
│   ├── firestore.rules           # Reglas oficiales de seguridad para la nube
│   └── firestore.indexes.json    # Índices de consulta si son requeridos
├── public/                       # Archivos públicos (icono de app, manifest PWA)
│   ├── favicon.ico
│   ├── icon-192.png              # Icono para pantalla de inicio del celular
│   ├── icon-512.png
│   └── manifest.json             # Permite "Añadir a pantalla de inicio"
├── specs/                        # Especificaciones y documentación del proyecto
│   ├── 01-spec.md                # Especificación funcional aprobada
│   └── 02-plan.md                # Este documento de arquitectura
├── src/
│   ├── assets/                   # Logotipos e imágenes complementarias
│   ├── components/               # Elementos visuales reutilizables
│   │   ├── AuthButton.jsx        # Botón de inicio de sesión con Google
│   │   ├── CurrencyInput.jsx     # Campo grande para escribir el dinero
│   │   ├── ExpenseForm.jsx       # Formulario para registrar o editar gastos
│   │   ├── GroupCard.jsx         # Tarjeta de resumen de cada viaje
│   │   ├── Navbar.jsx            # Barra superior con título y foto de usuario
│   │   ├── ParticipantList.jsx   # Lista de personas del grupo para agregar o editar
│   │   ├── SettlementList.jsx    # Bloque "Quién le paga a quién" con botón de pagar
│   │   └── WhatsAppButton.jsx    # Botón para generar y abrir el mensaje de WhatsApp
│   ├── context/
│   │   └── AuthContext.jsx       # Administra el estado de la sesión de Google
│   ├── pages/                    # Pantallas principales de la aplicación
│   │   ├── LoginPage.jsx         # Pantalla de bienvenida con botón de Google
│   │   ├── GroupsPage.jsx        # Pantalla "Mis Grupos"
│   │   └── GroupDetailPage.jsx   # Vista de un grupo (pestañas Gastos y Saldos)
│   ├── services/                 # Comunicación con Firebase
│   │   ├── firebase.js           # Inicialización de la conexión con Firebase
│   │   ├── groupsService.js      # Crear, listar, editar y borrar grupos
│   │   ├── expensesService.js    # Crear, listar, editar y borrar gastos
│   │   └── settlementsService.js # Registrar y borrar pagos/liquidaciones
│   ├── utils/                    # Funciones de lógica pura sin conexión visual
│   │   ├── debtSimplifier.js     # Algoritmo de mínimo de pagos ("quién paga a quién")
│   │   ├── formatters.js         # Formato de moneda ($0.00) y fechas
│   │   └── whatsappFormatter.js  # Redacta el mensaje legible para enviar a WhatsApp
│   ├── App.jsx                   # Componente raíz con rutas de navegación
│   ├── index.css                 # Estilos globales y configuración de Tailwind
│   └── main.jsx                  # Punto de entrada de la aplicación
├── tests/                        # Pruebas automatizadas de calidad
│   ├── debtSimplifier.test.js    # Pruebas matemáticas de saldos y mínimo de pagos
│   ├── whatsappFormatter.test.js # Pruebas del texto que se envía a WhatsApp
│   └── firestore.rules.test.js   # Pruebas de seguridad con el emulador local
├── .env.example                  # Plantilla de claves de conexión (sin secretos reales)
├── .gitignore                    # Archivos que nunca se suben a internet
├── firebase.json                 # Configuración del emulador local de Firebase
├── index.html                    # Página HTML base
├── package.json                  # Lista de dependencias del proyecto
├── tailwind.config.js            # Configuración de colores y diseño Tailwind
└── vite.config.js                # Configuración del servidor de desarrollo Vite
```

---

## 3. Modelo de Datos en Cloud Firestore

Firestore organiza los datos en **documentos** (fichas individuales) y **colecciones** (carpetas de fichas). La base de datos utilizada será la estándar `(default)`.

### Principio de Identificadores Únicos
Cada persona tiene un `id` generado automáticamente (por ejemplo `part_1a2b3c`). Si una amiga se llama "Sofi" y luego pide que le pongas "Sofía Pérez", se actualiza su nombre en el grupo pero su `id` nunca cambia; todos los gastos y pagos pasados siguen apuntando exactamente a ella.

### Estructura de Colecciones

```text
users/ (Colección)
  └── {userId} (Documento de la organizadora)

groups/ (Colección principal)
  └── {groupId} (Documento del grupo de viaje)
        ├── expenses/ (Subcolección de gastos de este grupo)
        │     └── {expenseId}
        └── settlements/ (Subcolección de pagos registrados)
              └── {settlementId}
```

---

### Detalle de los Documentos

#### A. Documento de Usuario: `users/{userId}`
Guarda el perfil básico de la organizadora autenticada.
```json
{
  "uid": "google_uid_12345",
  "name": "María González",
  "email": "maria@gmail.com",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-10-07T12:00:00Z"
}
```

#### B. Documento de Grupo: `groups/{groupId}`
Guarda la información general del viaje, su estado (abierto o cerrado), si tiene deudas pendientes y la lista de sus participantes con sus IDs.
```json
{
  "id": "grp_98765",
  "name": "Viaje a Valle de Bravo",
  "ownerId": "google_uid_12345",
  "currency": "USD",
  "isClosed": false,
  "hasPendingDebts": false,
  "participants": [
    {
      "id": "part_usr_01",
      "name": "María",
      "isOwner": true
    },
    {
      "id": "part_inv_02",
      "name": "Carlos",
      "isOwner": false
    },
    {
      "id": "part_inv_03",
      "name": "Andrea",
      "isOwner": false
    }
  ],
  "createdAt": "2026-10-07T14:30:00Z",
  "updatedAt": "2026-10-07T18:00:00Z"
}
```
*Compatibilidad con grupos anteriores:*
* `isClosed` (booleano): `true` cuando el viaje está cerrado, `false` cuando está activo. Si un grupo creado con la versión anterior no tiene el campo `isClosed`, tanto la aplicación como las reglas de seguridad lo tratan como `false` (viaje abierto).
* `hasPendingDebts` (booleano): `true` cuando alguien todavía debe dinero en el viaje, `false` cuando todos los participantes están a mano (\$0.00). La aplicación actualiza este campo al registrar o modificar gastos y pagos; si no existe en un grupo anterior sin deudas, se trata como `false`.

#### C. Documento de Gasto: `groups/{groupId}/expenses/{expenseId}`
Guarda un consumo específico, quién puso el dinero y cómo se reparte entre los IDs.
```json
{
  "id": "exp_45678",
  "description": "Cena de bienvenida",
  "amount": 90.00,
  "paidById": "part_usr_01",
  "splitType": "equal", 
  "splits": [
    { "participantId": "part_usr_01", "amount": 30.00 },
    { "participantId": "part_inv_02", "amount": 30.00 },
    { "participantId": "part_inv_03", "amount": 30.00 }
  ],
  "createdAt": "2026-10-07T21:00:00Z"
}
```
*Tipos de división (`splitType`):*
* `"equal"`: Se divide en partes iguales entre todos los miembros actuales del grupo.
* `"custom_equal"`: Se divide en partes iguales entre los `participantId` listados en `splits`.
* `"exact"`: Cada persona en `splits` tiene un monto personalizado en dólares que suma el total de `amount`.

#### D. Documento de Pago / Liquidación: `groups/{groupId}/settlements/{settlementId}`
Registra cuando un participante salda su cuenta con otro.
```json
{
  "id": "set_11223",
  "fromParticipantId": "part_inv_02",
  "toParticipantId": "part_usr_01",
  "amount": 30.00,
  "paidAt": "2026-10-08T10:15:00Z"
}
```

---

## 4. Reglas de Seguridad Completas (`firestore.rules`)

Las reglas de seguridad se ejecutan en los servidores de Google antes de permitir cualquier lectura o escritura. Garantizan que **ninguna persona pueda ver, modificar ni borrar información de grupos ajenos, ni guardar datos corruptos o inválidos**.

### Explicación en lenguaje simple
* Una persona solo puede entrar si está debidamente autenticada con Google.
* La organizadora solo puede ver y editar sus propios grupos (donde su código de Google coincida con `ownerId`), incluyendo cerrarlos y reabrirlos.
* **Validación de grupo y bloqueo de cierre con deudas:** Un grupo no se puede crear ni actualizar si tiene menos de 2 participantes, y los campos `isClosed` y `hasPendingDebts` (si están presentes) deben ser booleanos. Además, la regla `canUpdateGroupCloseState()` impide cerrar un viaje (`isClosed == true`) si todavía existen deudas pendientes (`hasPendingDebts == true` en el grupo guardado o en la solicitud).
* **Protección de viajes cerrados (modo solo lectura en el servidor):** Mientras un viaje esté cerrado (`isClosed == true`), las reglas de Firestore bloquean crear, editar o borrar gastos y pagos en ese grupo (`isGroupOpen(groupId)`), y también bloquean modificar los datos del grupo salvo para reabrirlo (`request.resource.data.get('isClosed', false) == false`). Los grupos con `isClosed == false` o los grupos antiguos que no tienen el campo `isClosed` se consideran abiertos.
* **Validación de gastos:** No se puede guardar un gasto de \$0 ni negativo (`amount > 0`), y el gasto debe incluir obligatoriamente al menos una persona asignada en `splits`.
* **Validación de pagos:** Un pago no puede ser de \$0 ni negativo (`amount > 0`), y una persona **no** puede pagarse a sí misma (`fromParticipantId != toParticipantId`).
* Los gastos y pagos solo pueden crearse o modificarse si el grupo al que pertenecen es propiedad de quien hace la petición y el viaje está abierto.

### Código Oficial de Reglas: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Función auxiliar: verifica que el usuario haya iniciado sesión con Google
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    // Función auxiliar: verifica que el usuario autenticado sea el dueño del recurso
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Función auxiliar: verifica si el usuario es dueño del grupo padre
    function isGroupOwner(groupId) {
      return isAuthenticated() && 
        request.auth.uid == get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId;
    }

    // Función auxiliar: verifica que el grupo esté abierto (compatible con grupos anteriores sin isClosed)
    function isGroupOpen(groupId) {
      return get(/databases/$(database)/documents/groups/$(groupId)).data.get('isClosed', false) != true;
    }

    // Validación de integridad del grupo: al menos 2 personas y tipos booleanos en campos opcionales
    function isValidGroupData() {
      return request.resource.data.participants is list &&
             request.resource.data.participants.size() >= 2 &&
             (!('isClosed' in request.resource.data) || request.resource.data.isClosed is bool) &&
             (!('hasPendingDebts' in request.resource.data) || request.resource.data.hasPendingDebts is bool);
    }

    // Validación de cierre y solo lectura del grupo:
    // 1. Si el grupo ya está cerrado, solo permite actualizarlo para reabrirlo (isClosed == false).
    // 2. Si se intenta cerrar (isClosed == true), exige que no haya deudas pendientes (hasPendingDebts == false).
    function canUpdateGroupCloseState() {
      return (resource.data.get('isClosed', false) != true || request.resource.data.get('isClosed', false) == false) &&
             (request.resource.data.get('isClosed', false) != true ||
              (resource.data.get('hasPendingDebts', false) == false &&
               request.resource.data.get('hasPendingDebts', false) == false));
    }

    // Validación de integridad de gasto: monto positivo y al menos 1 persona asignada
    function isValidExpenseData() {
      return request.resource.data.amount is number &&
             request.resource.data.amount > 0 &&
             request.resource.data.splits is list &&
             request.resource.data.splits.size() >= 1;
    }

    // Validación de integridad de pago: monto positivo y partes distintas (no auto-pago)
    function isValidSettlementData() {
      return request.resource.data.amount is number &&
             request.resource.data.amount > 0 &&
             request.resource.data.fromParticipantId is string &&
             request.resource.data.toParticipantId is string &&
             request.resource.data.fromParticipantId != request.resource.data.toParticipantId;
    }

    // 1. Colección de usuarios: cada quien solo gestiona su propio perfil
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // 2. Colección de grupos
    match /groups/{groupId} {
      // Leer: solo el creador del grupo
      allow read: if isAuthenticated() && resource.data.ownerId == request.auth.uid;

      // Crear: solo si es el dueño, contiene al menos 2 participantes y nace abierto
      allow create: if isAuthenticated() && 
                    request.resource.data.ownerId == request.auth.uid &&
                    request.resource.data.get('isClosed', false) == false &&
                    isValidGroupData();

      // Actualizar: solo el dueño original, manteniendo al menos 2 participantes y respetando las reglas de cierre
      allow update: if isAuthenticated() && 
                    resource.data.ownerId == request.auth.uid &&
                    request.resource.data.ownerId == request.auth.uid &&
                    isValidGroupData() &&
                    canUpdateGroupCloseState();

      // Eliminar: solo el creador original
      allow delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;

      // 3. Subcolección de gastos del grupo
      match /expenses/{expenseId} {
        allow read: if isGroupOwner(groupId);
        allow create, update: if isGroupOwner(groupId) && isGroupOpen(groupId) && isValidExpenseData();
        allow delete: if isGroupOwner(groupId) && isGroupOpen(groupId);
      }

      // 4. Subcolección de pagos/liquidaciones del grupo
      match /settlements/{settlementId} {
        allow read: if isGroupOwner(groupId);
        allow create, update: if isGroupOwner(groupId) && isGroupOpen(groupId) && isValidSettlementData();
        allow delete: if isGroupOwner(groupId) && isGroupOpen(groupId);
      }
    }
  }
}
```

---

## 5. Algoritmo del Mínimo de Pagos ("Quién le paga a quién")

Cuando varias personas compran cosas durante un viaje, hacer transferencias cruzadas individuales es caótico (María le debe a Carlos, Carlos a Juan, Juan a María). El objetivo es encontrar **la menor cantidad de transferencias posibles** para que todos queden en cero.

### Explicación Paso a Paso

1. **Calcular la balanza neta de cada participante:**
   Para cada persona en el grupo se suma todo lo que pagó de su bolsillo y se le resta todo lo que consumió en los gastos. También se descuentan los pagos directos ya realizados.
   $$\text{Balance Neto} = (\text{Total Pagado} + \text{Pagos enviados}) - (\text{Total Consumido} + \text{Pagos recibidos})$$
   * Si el resultado es **positivo (+)**: a esa persona le deben dinero (**Acreedor**).
   * Si el resultado es **negativo (-)**: esa persona debe dinero (**Deudor**).
   * Si el resultado es **cero (\$0.00)**: está "Al día".

2. **Verificación de consistencia matemática:**
   La suma de todos los balances netos siempre debe ser exactamente \$0.00. Si alguien debe \$50 en total, hay exactamente \$50 que le deben a otros.

3. **Emparejamiento voraz (Algoritmo Greedy de Simplificación):**
   * Se toma a la persona que **más debe** (el mayor deudor).
   * Se toma a la persona a la que **más le deben** (el mayor acreedor).
   * Se calcula el monto a transferir: el mínimo entre lo que uno debe y lo que el otro espera recibir.
   * Se genera una instrucción de pago directa:  
     `[Deudor] paga $[Monto] a [Acreedor]`.
   * Se actualizan los saldos de ambos. Quien quede en \$0.00 sale de la lista.
   * Se repite este proceso hasta que todas las deudas queden en cero.

### Ejemplo Ilustrativo

* **Gasto 1:** María pagó \$60 por el almuerzo de María, Carlos y Andrea (\$20 cada uno).
* **Gasto 2:** Carlos pagó \$30 por el taxi de Carlos y Andrea (\$15 cada uno).

**Cálculo de Balanzas:**
* **María:** Pagó \$60, consumió \$20 $\rightarrow$ Balance: **+\$40** (le deben \$40).
* **Carlos:** Pagó \$30, consumió \$35 (\$20 almuerzo + \$15 taxi) $\rightarrow$ Balance: **-\$5** (debe \$5).
* **Andrea:** Pagó \$0, consumió \$35 (\$20 almuerzo + \$15 taxi) $\rightarrow$ Balance: **-\$35** (debe \$35).

**Resultado Simplificado de Transferencias:**
1. Andrea (debe \$35) le transfiere \$35 a María (que espera \$40).  
   *(Andrea queda en \$0, a María le faltan \$5).*
2. Carlos (debe \$5) le transfiere \$5 a María.  
   *(Carlos queda en \$0, María queda en \$0).*

**Total de transferencias:** Solo 2 pagos directos, en lugar de transferencias cruzadas confusas.

---

## 6. Generación del Enlace para WhatsApp (`wa.me`)

Para evitar costos de servidores y servicios de mensajería externos, la aplicación utiliza el protocolo web universal de WhatsApp (`https://wa.me/`).

### Cómo funciona
1. La aplicación genera un texto claro con el balance del grupo:
   ```text
   🌴 *Cuentas Claras - Viaje a Valle de Bravo*
   Total del viaje: $90.00

   📋 *Quién le paga a quién:*
   • Andrea le paga $35.00 a María
   • Carlos le paga $5.00 a María

   ✅ *Al día:*
   • Ninguno pendiente
   ```
2. Este texto se codifica en formato URL seguro (`encodeURIComponent`).
3. Se genera un enlace simple:
   `https://wa.me/?text=...`
4. Al pulsar el botón "Compartir por WhatsApp", el celular abre la aplicación de WhatsApp directamente y te permite elegir el chat o grupo de amigos donde deseas enviarlo. Costo: **\$0**.

---

## 7. Estrategia de Pruebas Automatizadas

Para garantizar que nadie pierda dinero por un error de cálculo o sufra una fuga de datos, se configurarán dos tipos de pruebas con **Vitest**:

### 7.1. Pruebas Unitarias de Cálculos Matemáticos (`debtSimplifier.test.js`)
Un programa de pruebas que valida múltiples escenarios de gastos:
* **Escenario 1 (División en partes iguales):** Tres personas pagan cantidades distintas y el sistema genera el mínimo de transferencias exacto.
* **Escenario 2 (División selectiva):** Alguien no participó en un gasto y su deuda no se ve afectada.
* **Escenario 3 (Montos exactos):** Gastos con decimales (por ejemplo centavos sobrantes como \$33.33) quedan perfectamente balanceados sin pérdidas de dinero.
* **Escenario 4 (Pagos parciales):** Si Carlos debía \$20 y se marca un abono de \$10, su nuevo saldo debe reflejar exactamente \$10 pendientes.

### 7.2. Pruebas de Reglas de Seguridad (`firestore.rules.test.js`)
Utilizando la librería oficial de pruebas de Firebase (`@firebase/rules-unit-testing`) y los emuladores locales:
* **Prueba 1 (Aislamiento entre usuarios):** Un usuario "B" intenta leer o modificar un grupo de "A"; Firebase lo bloquea con `PERMISSION_DENIED`.
* **Prueba 2 (Usuario Anónimo):** Un usuario sin iniciar sesión intenta leer o escribir datos; Firebase lo bloquea inmediatamente.
* **Prueba 3 (Monto no positivo en gastos):** Intentar guardar un gasto con monto \$0 o negativo (ej. `amount: -15` o `amount: 0`); la regla `isValidExpenseData()` lo rechaza.
* **Prueba 4 (Gasto sin participantes):** Intentar guardar un gasto con `splits: []`; la regla `isValidExpenseData()` lo rechaza por tener menos de 1 participante.
* **Prueba 5 (Auto-pago):** Intentar registrar una liquidación donde `fromParticipantId == toParticipantId` (una persona pagándose a sí misma); la regla `isValidSettlementData()` lo rechaza.
* **Prueba 6 (Monto no positivo en pagos):** Intentar registrar un pago con monto \$0 o negativo; la regla `isValidSettlementData()` lo rechaza.
* **Prueba 7 (Grupo con menos de 2 participantes):** Intentar crear o actualizar un grupo con solo 1 o 0 personas en `participants`; la regla `isValidGroupData()` lo rechaza.
* **Prueba 8 (Operaciones legítimas del dueño):** El usuario creador puede crear grupos (≥2 personas), registrar gastos válidos (>0 con participantes) y pagos legítimos con éxito total.
* **Prueba 9 (Bloqueo de escritura en viajes cerrados):** En un grupo con `isClosed: true`, la regla `isGroupOpen(groupId)` bloquea crear, editar o borrar gastos y pagos, y `canUpdateGroupCloseState()` bloquea editar el grupo mientras siga cerrado.
* **Prueba 10 (Compatibilidad con grupos existentes sin datos nuevos):** Un grupo creado con la versión anterior (sin los campos `isClosed` ni `hasPendingDebts`) sigue permitiendo editar el grupo y registrar, editar o borrar gastos y pagos con normalidad (`data.get('isClosed', false) != true`).
* **Prueba 11 (Bloqueo de cierre si alguien todavía debe):** Si el grupo tiene deudas pendientes (`hasPendingDebts: true`), intentar cerrarlo (`isClosed: true`) es rechazado por la regla `canUpdateGroupCloseState()`.
* **Prueba 12 (Solo la dueña puede cerrar y reabrir un viaje):** La dueña (`ownerId`) puede cerrar un viaje liquidado (`isClosed: true`, `hasPendingDebts: false`) y volver a abrirlo (`isClosed: false`), mientras que cualquier otro usuario recibe `PERMISSION_DENIED`.

---

## 8. Publicación en Vercel Conectado a GitHub (Costo Cero)

El ciclo de publicación se mantiene completamente en la capa gratuita (Free Tier) de las plataformas:

```
[Tu Computadora] ──(git push)──► [GitHub (Repositorio Privado)]
                                            │
                                            ▼ (Despliegue Automático)
                                  [Vercel (Alojamiento Web)]
                                            │
                                            ▼ (Conecta con)
                               [Firebase Cloud Firestore / Auth]
```

### Advertencia Crítica: ¿Qué pasa si la base de datos se usa sin desplegar las reglas?
* **Si Firestore se creó en "Modo Producción":** Por defecto, Google deniega absolutamente todas las lecturas y escrituras (`allow read, write: if false;`). La aplicación web cargará visualmente, pero se congelará con errores al intentar crear grupos o registrar gastos.
* **Si Firestore se dejó en "Modo de Prueba":** Cualquiera en internet podría leer, alterar o borrar toda la base de datos.
* **Solución obligatoria:** Antes de usar la app en producción, es indispensable desplegar las reglas del archivo `firestore.rules` a Firebase con el comando:
  ```bash
  npx firebase deploy --only firestore:rules
  ```

---

### Paso a Paso para la Publicación:

1. **Repositorio en GitHub:**
   * Se inicializa el proyecto con Git y se sube a un repositorio privado en GitHub.
2. **Crear Proyecto en Firebase Console:**
   * Crear proyecto en [console.firebase.google.com](https://console.firebase.google.com) en el plan gratuito "Spark" ($0/mes).
   * Habilitar el proveedor **Google** en Firebase Authentication.
   * Habilitar **Cloud Firestore** en modo de producción con la base de datos `(default)`.
   * Copiar las credenciales públicas de la app web (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
3. **Desplegar Reglas de Seguridad a Firebase:**
   * Desde la terminal del proyecto, ejecutar:
     ```bash
     npx firebase deploy --only firestore:rules
     ```
   * Esto asegura inmediatamente la base de datos con las validaciones de `specs/02-plan.md`.
4. **Conectar en Vercel:**
   * Iniciar sesión en [vercel.com](https://vercel.com) con la cuenta de GitHub.
   * Seleccionar "Add New Project" e importar el repositorio `cuentas-claras`.
   * En la sección de configuración "Environment Variables" (Variables de Entorno), ingresar las claves de Firebase:
     * `VITE_FIREBASE_API_KEY`
     * `VITE_FIREBASE_AUTH_DOMAIN`
     * `VITE_FIREBASE_PROJECT_ID`
     * `VITE_FIREBASE_STORAGE_BUCKET`
     * `VITE_FIREBASE_MESSAGING_SENDER_ID`
     * `VITE_FIREBASE_APP_ID`
5. **Despliegue Continuo:**
   * Vercel compila la aplicación en segundos y genera una dirección web segura (ej. `https://cuentas-claras.vercel.app`) con certificado SSL gratuito.
   * Cada vez que realices una mejora y hagas `git push`, Vercel actualizará la aplicación automáticamente sin costo alguno.


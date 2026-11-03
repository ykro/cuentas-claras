# Plan Técnico: Cuentas Claras

## 1. Decisiones tecnológicas (explicadas en una línea)

- **React (en JavaScript, sin TypeScript):** actualiza la pantalla al instante cada vez que anotas un gasto o marcas un pago, sin recargar la página ni agregar complejidad extra de lenguaje.
- **Vite:** arranca la aplicación en menos de un segundo mientras la construimos y empaqueta todo listo para internet.
- **Tailwind CSS:** permite diseñar la interfaz limpia tipo banco (fondo claro, números grandes, verde y rojo suave) directamente sobre cada pantalla.
- **Lucide React (`lucide-react`):** colección de íconos limpios y uniformes que hacen fácil identificar cada botón desde el celular.
- **Identificador único (`id`) por persona:** cada amigo tiene un código interno fijo (como un número de cédula) para que puedas corregir su nombre cuando quieras sin que se pierdan sus gastos ni sus pagos.
- **Firebase Authentication (Google):** permite que entres con tu cuenta de Google en un toque, delegando la seguridad de contraseñas a Google.
- **Cloud Firestore (base de datos `(default)`):** guarda tus grupos, gastos y pagos en la nube en tiempo real para que no se borren aunque cambies de teléfono.
- **`firebase-tools` local (`npx firebase`):** instala las herramientas de Firebase dentro de la carpeta del proyecto sin ensuciar ni modificar el resto de tu computadora.
- **Vitest + Emulador local de Firestore:** comprueba automáticamente que las cuentas cuadren al centavo y que nadie más pueda ver ni tocar tus datos antes de publicar.
- **Enlace directo `wa.me` para WhatsApp:** abre WhatsApp con el mensaje de cobro ya escrito usando un enlace estándar gratuito, sin pagar servidores ni APIs.
- **GitHub + Vercel (costo cero):** guarda el código en GitHub y publica la app automáticamente en internet gratis cada vez que guardamos una mejora.

---

## 2. Estructura de carpetas del proyecto

```text
cuentas-claras/
├── public/
│   ├── manifest.webmanifest      # Permite instalar la app en la pantalla de inicio del celular
│   └── icon.svg                  # Ícono de Cuentas Claras
├── specs/
│   ├── 01-spec.md                # Qué hace la aplicación (Especificación)
│   ├── 02-plan.md                # Cómo está construida (este Plan Técnico)
│   └── 03-tasks.md               # Lista de pasos de construcción
├── src/
│   ├── components/               # Piezas visuales (Pantallas de Grupos, Saldos, Formulario de Gasto)
│   ├── lib/
│   │   ├── firebase.js           # Conexión con Google Login y la base de datos Firestore
│   │   ├── balances.js           # Motor matemático: división de gastos, saldos y mínimo de pagos
│   │   └── whatsapp.js           # Generador del mensaje y enlace wa.me para WhatsApp
│   ├── App.jsx                   # Controlador principal de navegación y sesión
│   ├── main.jsx                  # Punto de arranque de la aplicación
│   └── index.css                 # Estilos base (modo claro, tipografía y colores de banca)
├── tests/
│   ├── balances.test.js          # Pruebas matemáticas del cálculo de saldos y centavos
│   └── firestore.rules.test.js   # Pruebas de seguridad con la base de datos local de Firebase
├── firebase.json                 # Configuración de reglas y del emulador local de Firebase
├── firestore.rules               # Reglas de seguridad que protegen los datos de la organizadora
├── index.html                    # Página principal adaptable a celular
├── package.json                  # Lista de librerías y comandos del proyecto (incluye firebase-tools)
└── vite.config.js                # Configuración de Vite y Vitest
```

---

## 3. Cómo se guardan los datos en Firestore

Usaremos la base de datos **`(default)`** de Firestore con una estructura jerárquica donde cada grupo pertenece exclusivamente a la organizadora que lo creó (`ownerId`), y dentro de cada grupo viven sus gastos y pagos.

### 3.1. Documento de Grupo: `groups/{groupId}`
Guarda el nombre del grupo, quién es la dueña, el mapa de nombres por `id` (`memberNames`) y la lista de personas con su `id` único (`memberIds` y `members`):

```json
{
  "ownerId": "uid_de_google_de_la_organizadora",
  "name": "Viaje a Antigua",
  "currency": "USD",
  "memberIds": ["m_1", "m_2", "m_3"],
  "members": [
    { "id": "m_1", "name": "Ana" },
    { "id": "m_2", "name": "Carlos" },
    { "id": "m_3", "name": "Lucía" }
  ],
  "createdAt": "2026-11-03T10:30:00Z",
  "updatedAt": "2026-11-03T10:35:00Z"
}
```
- `memberIds` guarda la lista plana de identificadores (`["m_1", "m_2", "m_3"]`) para que las reglas de seguridad de Firestore puedan verificar que quien paga un gasto o un pago realmente pertenece al grupo.

### 3.2. Subcolección de Gastos: `groups/{groupId}/expenses/{expenseId}`
Cada gasto guarda el `id` de quién pagó (`paidByMemberId`), la lista de `participantIds` y un mapa (`splitsCents`) con lo que le toca a cada `id` en **centavos enteros** (por ejemplo, `$10.00` se guarda como `1000` centavos para evitar errores de decimales):

```json
{
  "ownerId": "uid_de_google_de_la_organizadora",
  "description": "Cena del viernes",
  "amountCents": 4500,
  "paidByMemberId": "m_1",
  "splitMode": "equal_all",
  "participantIds": ["m_1", "m_2", "m_3"],
  "splitsCents": {
    "m_1": 1500,
    "m_2": 1500,
    "m_3": 1500
  },
  "createdAt": "2026-11-03T20:15:00Z",
  "updatedAt": "2026-11-03T20:15:00Z"
}
```
- `splitMode` puede ser: `"equal_all"` (todos por igual), `"equal_subset"` (solo algunos por igual) o `"exact"` (montos exactos).
- Si luego cambias `"Carlos"` por `"Carlitos"` en `groups/{groupId}`, el gasto sigue apuntando a `"m_2"` sin romperse.

### 3.3. Subcolección de Pagos: `groups/{groupId}/payments/{paymentId}`
Cada vez que alguien salda su deuda, se guarda quién pagó (`fromMemberId`), quién recibió (`toMemberId`) y el monto en centavos (`amountCents`):

```json
{
  "ownerId": "uid_de_google_de_la_organizadora",
  "fromMemberId": "m_2",
  "toMemberId": "m_1",
  "amountCents": 1500,
  "createdAt": "2026-11-04T09:00:00Z"
}
```

### 3.4. Borrado limpio de un grupo
En Firestore, borrar el documento `groups/{groupId}` no borra automáticamente sus subcolecciones. Por eso, cuando la organizadora borra un grupo, la aplicación primero elimina todos los documentos de `expenses` y `payments` de ese grupo en un lote (`writeBatch`) y enseguida elimina `groups/{groupId}`, evitando dejar datos huérfanos.

---

## 4. Reglas de seguridad completas (`firestore.rules`)

Estas reglas corregidas garantizan:
1. **Aislamiento total por dueña (`ownerId`):** solo la organizadora autenticada puede leer o escribir sus grupos, gastos y pagos, y `ownerId` no se puede cambiar nunca en una actualización.
2. **Esquema cerrado (`keys().hasOnly(...)`):** se rechaza cualquier documento con campos extra o inventados.
3. **Límites de longitud y tamaño:** nombres, descripciones y listas tienen tamaño mínimo y máximo para impedir textos vacíos o abusivos.
4. **Existencia del grupo padre y pertenencia de miembros:** para crear o editar un gasto o pago, el grupo padre debe existir, pertenecer a la misma organizadora y los `id` de las personas (`paidByMemberId`, `fromMemberId`, `toMemberId`, `participantIds` y las llaves de `splitsCents`) deben pertenecer al grupo.
5. **Inmutabilidad de pagos y fechas de creación:** un pago registrado no se puede adulterar (`allow update: if false;`; si hubo error se borra y se vuelve a crear), y `createdAt` no puede modificarse al editar un grupo o gasto.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(ownerId) {
      return isSignedIn() && request.auth.uid == ownerId;
    }

    function groupPath(groupId) {
      return /databases/$(database)/documents/groups/$(groupId);
    }

    function groupExists(groupId) {
      return exists(groupPath(groupId));
    }

    function getGroupData(groupId) {
      return get(groupPath(groupId)).data;
    }

    function isGroupOwner(groupId) {
      return isSignedIn()
        && groupExists(groupId)
        && getGroupData(groupId).ownerId == request.auth.uid;
    }

    function isValidGroup(data) {
      return data.keys().hasOnly([
          'ownerId',
          'name',
          'currency',
          'memberIds',
          'members',
          'createdAt',
          'updatedAt'
        ])
        && isOwner(data.ownerId)
        && data.name is string
        && data.name.size() >= 1
        && data.name.size() <= 80
        && data.currency == 'USD'
        && data.memberIds is list
        && data.memberIds.size() >= 2
        && data.memberIds.size() <= 50
        && data.members is list
        && data.members.size() == data.memberIds.size()
        && data.createdAt is string
        && data.updatedAt is string;
    }

    function isValidExpense(data, groupId) {
      let group = getGroupData(groupId);
      return data.keys().hasOnly([
          'ownerId',
          'description',
          'amountCents',
          'paidByMemberId',
          'splitMode',
          'participantIds',
          'splitsCents',
          'createdAt',
          'updatedAt'
        ])
        && isOwner(data.ownerId)
        && data.description is string
        && data.description.size() >= 1
        && data.description.size() <= 140
        && data.amountCents is int
        && data.amountCents > 0
        && data.amountCents <= 100000000
        && data.paidByMemberId is string
        && data.paidByMemberId in group.memberIds
        && data.splitMode in ['equal_all', 'equal_subset', 'exact']
        && data.participantIds is list
        && data.participantIds.size() >= 1
        && data.participantIds.size() <= group.memberIds.size()
        && group.memberIds.hasAll(data.participantIds)
        && data.splitsCents is map
        && data.splitsCents.keys().size() == data.participantIds.size()
        && data.splitsCents.keys().hasOnly(data.participantIds)
        && data.createdAt is string
        && data.updatedAt is string;
    }

    function isValidPayment(data, groupId) {
      let group = getGroupData(groupId);
      return data.keys().hasOnly([
          'ownerId',
          'fromMemberId',
          'toMemberId',
          'amountCents',
          'createdAt'
        ])
        && isOwner(data.ownerId)
        && data.fromMemberId is string
        && data.toMemberId is string
        && data.fromMemberId != data.toMemberId
        && data.fromMemberId in group.memberIds
        && data.toMemberId in group.memberIds
        && data.amountCents is int
        && data.amountCents > 0
        && data.amountCents <= 100000000
        && data.createdAt is string;
    }

    match /groups/{groupId} {
      allow read: if isOwner(resource.data.ownerId);

      allow create: if isValidGroup(request.resource.data);

      allow update: if isOwner(resource.data.ownerId)
        && isValidGroup(request.resource.data)
        && request.resource.data.ownerId == resource.data.ownerId
        && request.resource.data.createdAt == resource.data.createdAt;

      allow delete: if isOwner(resource.data.ownerId);

      match /expenses/{expenseId} {
        allow read: if isOwner(resource.data.ownerId) && isGroupOwner(groupId);

        allow create: if isGroupOwner(groupId)
          && isValidExpense(request.resource.data, groupId);

        allow update: if isOwner(resource.data.ownerId)
          && isGroupOwner(groupId)
          && isValidExpense(request.resource.data, groupId)
          && request.resource.data.ownerId == resource.data.ownerId
          && request.resource.data.createdAt == resource.data.createdAt;

        allow delete: if isOwner(resource.data.ownerId);
      }

      match /payments/{paymentId} {
        allow read: if isOwner(resource.data.ownerId) && isGroupOwner(groupId);

        allow create: if isGroupOwner(groupId)
          && isValidPayment(request.resource.data, groupId);

        allow update: if false;

        allow delete: if isOwner(resource.data.ownerId);
      }
    }
  }
}
```

---

## 5. Cómo se calcula el mínimo de pagos

Para que nunca falte ni sobre un centavo, todos los cálculos internos se hacen en **centavos enteros** (`$10.00` = `1000` centavos) en cuatro pasos simples:

1. **Reparto exacto de cada gasto:**
   - Si un gasto de `$10.00` (`1000` centavos) se divide en partes iguales entre 3 personas, cada una recibe `333` centavos y el centavo sobrante (`1000 % 3 = 1`) se asigna al primer participante (`334`, `333`, `333`), sumando exactamente `1000`.
2. **Saldo neto de cada persona:**
   - Empezamos a todos en `0`.
   - Por cada **gasto**: a quien pagó se le **suma** el monto total (`+amountCents`), y a cada participante se le **resta** su parte (`-splitsCents[id]`).
   - Por cada **pago registrado**: a quien entregó el dinero se le **suma** lo que pagó (`+amountCents`), y a quien lo recibió se le **resta** (`-amountCents`).
   - Resultado: quienes tienen saldo **positivo (`+`)** son acreedores (les deben dinero, en verde); quienes tienen saldo **negativo (`-`)** son deudores (deben dinero, en rojo suave); quienes tienen `0` están a mano.
3. **Emparejamiento del mínimo de pagos:**
   - Separamos la lista de **deudores** (los que deben) y la de **acreedores** (a los que les deben), ordenados del monto más grande al más pequeño.
   - Tomamos al mayor deudor y le indicamos que le pague al mayor acreedor el menor de ambos montos.
   - Restamos ese pago de ambos saldos; quien llega a `0` queda listo y repetimos con el siguiente hasta que todos queden en `0`.
4. **Mensaje para WhatsApp (`wa.me`):**
   - Con esa lista mínima de transferencias armamos un texto claro (por ejemplo: *"Cuentas Claras — Viaje a Antigua. Pagos pendientes: • Carlos → Ana: $15.00"*) y abrimos `https://wa.me/?text=...` con el texto codificado listo para enviarlo al grupo.

---

## 6. Cómo se prueba la aplicación

Usaremos dos baterías de pruebas automáticas antes de publicar:

### 6.1. Pruebas del cálculo de saldos (`npx vitest run tests/balances.test.js`)
- División en partes iguales entre todos, entre solo algunos y con montos exactos.
- Reparto exacto de centavos impares (ej. `$10.00` entre 3 personas = `334`, `333`, `333` centavos).
- Simplificación de deudas al mínimo de pagos posibles (si A debe a B y B debe a C, solo A le paga a C).
- Actualización inmediata de saldos al registrar o deshacer un pago.
- Bloqueo de eliminación de una persona si todavía tiene gastos o pagos registrados en el grupo.

### 6.2. Pruebas de reglas de seguridad con el emulador local de Firebase (`npx firebase emulators:exec --only firestore "npx vitest run tests/firestore.rules.test.js"`)
Levanta una base de datos de prueba en tu computadora (usando Java 21 y `npx firebase`) sin tocar internet y verifica cada regla:

1. **Acceso sin sesión bloqueado:** una persona sin iniciar sesión no puede leer ni escribir grupos, gastos ni pagos.
2. **Aislamiento entre usuarias:** la organizadora `uid_A` puede crear, leer, editar y borrar sus propios grupos, gastos y pagos, pero otra usuaria `uid_B` es rechazada al intentar leer, editar o borrar cualquier documento de `uid_A`.
3. **Bloqueo de robo de propiedad (`ownerId` inmutable):** `uid_A` no puede crear un documento a nombre de `uid_B` ni cambiar el `ownerId` o `createdAt` al actualizar un grupo o gasto.
4. **Validación de grupo válido:** rechaza grupos sin nombre, con nombres de más de 80 caracteres, con moneda distinta de `'USD'`, con menos de 2 integrantes o donde `members.size()` no coincida con `memberIds.size()`.
5. **Rechazo de campos extra no autorizados (`hasOnly`):** rechaza grupos, gastos o pagos que intenten inyectar campos desconocidos no definidos en el esquema.
6. **Validación de gasto y pertenencia al grupo:** rechaza gastos con monto `0`, negativo o decimal, sin descripción, con un `splitMode` inválido, o donde `paidByMemberId`, `participantIds` o las llaves de `splitsCents` incluyan un `id` que no pertenece a `memberIds` del grupo padre.
7. **Protección de grupo padre inexistente:** rechaza la creación de gastos o pagos dentro de un `groupId` que no existe en Firestore.
8. **Validación e inmutabilidad de pagos:** rechaza pagos donde `fromMemberId == toMemberId`, donde alguno de los dos `id` no pertenezca al grupo, con monto `<= 0`, o cualquier intento de editar (`update`) un pago ya creado.

---

## 7. Cómo se publica en internet (Costo cero)

1. **Crear proyecto en Firebase (Plan Spark gratuito):**
   - Activar **Authentication** con el proveedor **Google**.
   - Crear la base de datos **Cloud Firestore `(default)`**.
   - Publicar las reglas de seguridad desde la carpeta del proyecto con:
     ```bash
     npx firebase deploy --only firestore:rules
     ```
2. **Subir el código a GitHub:**
   - Inicializar Git en el proyecto y crear el repositorio con GitHub CLI (`gh repo create`).
3. **Conectar con Vercel (Plan Hobby gratuito):**
   - Importar el repositorio de GitHub en Vercel.
   - Agregar las variables de configuración pública de Firebase (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.).
   - Agregar el dominio `.vercel.app` que nos da Vercel dentro de los *"Dominios autorizados"* de Firebase Authentication.
4. **Uso desde el celular:**
   - Abrir el enlace de Vercel en el navegador del teléfono y elegir **"Agregar a la pantalla de inicio"** para abrir **Cuentas Claras** como una app más.

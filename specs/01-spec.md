# Especificación de Producto: Cuentas Claras

## 1. Problema

Cuando se organizan viajes o salidas en grupo, una persona suele adelantar varios pagos (comidas, entradas, transporte, compras pequeñas) y al final intenta cuadrar todo en una hoja de cálculo. En la práctica ocurren cuatro problemas recurrentes:

1. **Se olvidan los gastos pequeños:** al no anotarlos en el momento desde el celular, muchos pagos menores nunca entran a la cuenta.
2. **No todos los gastos son para todos:** en una misma salida hay consumos donde solo participa una parte del grupo (por ejemplo, una cena a la que no fueron todos) o donde cada quien consumió un monto distinto.
3. **Se pierde el rastro de quién ya pagó:** conforme los amigos van transfiriendo en días distintos, resulta confuso saber quién sigue debiendo y cuánto falta por cobrar.
4. **Nadie abre la hoja de cálculo:** las tablas son difíciles de leer en el celular y no responden de forma directa la única pregunta que importa: *¿quién le tiene que pagar cuánto a quién?*

**Cuentas Claras** resuelve esto permitiendo anotar gastos en segundos desde el celular, calcular automáticamente el mínimo de pagos posibles para saldar todas las deudas, registrar quién ya pagó y enviar el resumen listo por WhatsApp.

---

## 2. Usuarios

### 2.1. Organizadora (Usuaria principal con sesión)
- Es la persona que lleva el control de los gastos del viaje o salida.
- Entra a la aplicación con su **cuenta de Google** para que sus grupos y gastos queden guardados y asociados a su perfil.
- Es la única persona que crea grupos, registra gastos, edita movimientos y marca los pagos recibidos.

### 2.2. Amigos / Integrantes del grupo (Participantes sin cuenta)
- **No necesitan crear cuenta, recibir invitaciones por correo ni instalar nada.**
- Existen dentro de cada grupo únicamente con su **nombre** (agregado por la organizadora).
- Reciben el resumen de cuánto deben y a quién pagarle directamente en el chat del grupo por **WhatsApp**.

---

## 3. Historias de usuario con criterios de aceptación verificables

### HU-01: Inicio de sesión de la organizadora
**Como** organizadora, **quiero** entrar con mi cuenta de Google **para** acceder a mis grupos desde mi celular sin perder mi información.

**Criterios de aceptación:**
- [ ] Si no he iniciado sesión, veo una pantalla de bienvenida con un único botón principal para entrar con Google.
- [ ] Al iniciar sesión correctamente, veo mi lista de grupos.
- [ ] Puedo cerrar mi sesión en cualquier momento y mis datos permanecen guardados cuando vuelva a entrar.

---

### HU-02: Crear y administrar un grupo
**Como** organizadora, **quiero** crear un grupo con su nombre y las personas que participan, y poder corregir nombres, agregar o quitar personas o borrar el grupo **para** mantener la lista de participantes al día.

**Criterios de aceptación:**
- [ ] Puedo crear un grupo indicando su nombre (obligatorio) y al menos 2 participantes con nombre único dentro del grupo.
- [ ] Puedo corregir el nombre de cualquier participante y el cambio se refleja en todos los gastos, pagos y saldos del grupo.
- [ ] Puedo agregar nuevas personas a un grupo existente en cualquier momento.
- [ ] Puedo quitar a una persona del grupo si no tiene gastos ni pagos registrados a su nombre; si ya participa en algún gasto o pago, el sistema me avisa claramente que primero debo ajustar o eliminar esos movimientos antes de quitarla.
- [ ] Puedo borrar un grupo completo tras confirmar la acción, eliminando sus gastos y pagos asociados.

---

### HU-03: Anotar un gasto con tres formas de división
**Como** organizadora, **quiero** registrar un gasto indicando descripción, monto en dólares, quién pagó y cómo se divide **para** capturar desde gastos parejos hasta consumos individuales sin hacer cuentas a mano.

**Criterios de aceptación:**
- [ ] Para guardar un gasto debo ingresar: descripción (obligatoria), monto mayor a `$0.00` (en dólares `USD`), la persona que pagó y el modo de división.
- [ ] **Modo 1 — En partes iguales entre todos:** el monto total se reparte equitativamente entre todos los integrantes del grupo.
- [ ] **Modo 2 — En partes iguales solo entre algunos:** puedo seleccionar qué personas participaron (mínimo 1 persona) y el monto se divide en partes iguales únicamente entre las seleccionadas.
- [ ] **Modo 3 — Con montos exactos:** puedo escribir cuánto le corresponde a cada persona; el sistema valida antes de guardar que la suma de los montos individuales sea exactamente igual al monto total del gasto (mostrando cuánto falta o sobra si no cuadra).
- [ ] Si al dividir en partes iguales quedan centavos impares (por ejemplo, `$10.00` entre 3 personas), el sistema reparte los centavos restantes de forma exacta (`$3.34`, `$3.33`, `$3.33`) para que nunca se pierda ni sobre un centavo.

---

### HU-04: Editar o borrar un gasto
**Como** organizadora, **quiero** corregir o eliminar cualquier gasto anotado **para** arreglar errores de captura sin tener que rehacer el grupo.

**Criterios de aceptación:**
- [ ] Al tocar un gasto de la lista, puedo modificar su descripción, monto, quién pagó o cómo se dividió.
- [ ] Al guardar los cambios del gasto, todos los saldos y pagos sugeridos del grupo se recalculan de inmediato.
- [ ] Puedo borrar un gasto y los saldos del grupo se actualizan al instante.

---

### HU-05: Ver saldos y el mínimo de pagos para quedar a mano
**Como** organizadora, **quiero** ver el saldo neto de cada persona y la lista simplificada de quién le paga a quién **para** saldar todas las cuentas con la menor cantidad de transferencias posibles.

**Criterios de aceptación:**
- [ ] Veo el gasto total acumulado del grupo.
- [ ] Veo el saldo neto de cada integrante:
  - En **verde** si le deben dinero (puso más de lo que le tocaba).
  - En **rojo suave** si debe dinero (puso menos de lo que le tocaba).
  - En estado neutro ("A mano" / `$0.00`) si no debe ni le deben.
- [ ] Veo la sección **"Quién le paga a quién"** con el **mínimo número de pagos posibles** para que todos queden en `$0.00` (por ejemplo: si Ana le debe `$10` a Luis y Luis le debe `$10` a Carla, el sistema sugiere un solo pago directo de Ana a Carla por `$10.00`).
- [ ] La suma de lo que reciben los acreedores coincide al centavo con la suma de lo que deben los deudores.

---

### HU-06: Registrar cuando alguien ya pagó
**Como** organizadora, **quiero** marcar cuando una persona ya realizó su pago **para** saber exactamente quién sigue pendiente y quién ya está a mano.

**Criterios de aceptación:**
- [ ] Desde cada pago sugerido en "Quién le paga a quién", puedo marcarlo como pagado con un toque (o registrar un pago entre dos personas indicando monto).
- [ ] Al registrar el pago, el saldo de ambas personas se actualiza de inmediato y la deuda saldada desaparece de los pagos pendientes.
- [ ] El pago queda listado en el historial de movimientos del grupo y puedo deshacerlo/borrarlo si lo marqué por error.

---

### HU-07: Enviar los saldos por WhatsApp
**Como** organizadora, **quiero** enviar el resumen de cuentas al chat del grupo por WhatsApp **para** que mis amigos vean de un vistazo cuánto deben y a quién pagarle sin abrir ninguna hoja de cálculo.

**Criterios de aceptación:**
- [ ] Tengo un botón claro para compartir por WhatsApp (o copiar el mensaje si prefiero pegarlo manualmente).
- [ ] El mensaje generado incluye: nombre del grupo, total gastado, la lista directa de **"Quién le paga a quién"** con montos en dólares (`$0.00`) y, si ya están todos en cero, un mensaje indicando que el grupo está a mano.
- [ ] Al tocar "Enviar por WhatsApp", se abre WhatsApp con el texto listo para enviarlo al chat del grupo.

---

## 4. Pantallas

1. **Acceso (Bienvenida):**
   - Nombre de la app (**Cuentas Claras**), breve explicación en una línea y botón único: **"Continuar con Google"**.
2. **Mis Grupos (Inicio):**
   - Lista de grupos activos con el nombre del grupo, cantidad de personas y estado resumido (total gastado o si ya están a mano).
   - Acción principal única: **"Nuevo grupo"**.
3. **Crear / Editar Grupo:**
   - Campo para el nombre del grupo.
   - Lista editable de personas (agregar nombre, corregir nombre existente, quitar persona).
   - Opción secundaria al final (solo en edición) para borrar el grupo.
   - Acción principal única: **"Guardar grupo"**.
4. **Detalle del Grupo (Vista principal del grupo):**
   - Encabezado con el nombre del grupo, gasto total en números grandes y acceso a editar el grupo.
   - Selector simple de dos vistas:
     - **Saldos (vista por defecto cuando se revisan cuentas):** muestra qué pagos faltan hacer (*"Quién le paga a quién"*) con opción para marcar cada uno como pagado, el saldo neto por persona (verde / rojo suave) y el botón para **enviar por WhatsApp**.
     - **Gastos (historial de movimientos):** lista cronológica de gastos y pagos registrados, mostrando descripción, quién pagó y el monto en grande.
   - Acción principal única fija: **"Anotar gasto"** (o **"Enviar por WhatsApp"** cuando se está en la pestaña de cobro con cuentas pendientes).
5. **Anotar / Editar Gasto:**
   - Monto en dólares (`$`) con números grandes al centro.
   - Descripción corta del gasto (ej. *"Cena del viernes"*, *"Uber al aeropuerto"*).
   - Selector de **Quién pagó**.
   - Selector de **Cómo se divide**: *Partes iguales (todos)*, *Solo algunos* o *Montos exactos*.
   - Opción secundaria (solo al editar) para borrar el gasto.
   - Acción principal única: **"Guardar gasto"**.

---

## 5. Reglas de interfaz

- **Estilo visual de banca personal:** aspecto limpio, ordenado y confiable.
- **Modo claro siempre:** fondo claro de alto contraste para lectura rápida bajo cualquier luz; sin modo oscuro.
- **Semántica de color inmediata:**
  - **Verde:** saldos a favor (lo que le deben a esa persona) y confirmaciones de cuenta saldada.
  - **Rojo suave:** saldos en contra (lo que esa persona debe pagar).
  - **Neutro oscuro:** montos generales, totales y personas que ya están a mano (`$0.00`).
- **Números grandes y legibles:** los montos en dólares (`$0.00`) son el elemento visual protagonista en cada fila y encabezado.
- **Una sola acción principal por pantalla:** cada vista tiene un único botón primario destacado para que nunca haya duda de cuál es el siguiente paso.
- **Prohibido anidar tarjetas ("sin tarjetas dentro de tarjetas"):** usar listas limpias separadas por líneas sutiles o bloques de un solo nivel. Menos es más.
- **Pensada para el celular e instalable en pantalla de inicio:** diseñada para manejarse con el pulgar en pantallas verticales de teléfono y lista para agregarse a la pantalla de inicio del celular como aplicación web.

---

## 6. Datos en lenguaje simple

Toda la información pertenece a la cuenta de la organizadora y se organiza en cuatro elementos simples:

1. **Grupo:**
   - Nombre del grupo (ej. *"Viaje a Antigua"*).
   - Fecha de creación.
   - Lista de personas del grupo.
2. **Persona (integrante del grupo):**
   - Identificador único dentro del grupo.
   - Nombre visible (ej. *"Ana"*, *"Carlos"*).
3. **Gasto:**
   - Descripción (ej. *"Almuerzo"*).
   - Monto total en dólares (`USD`, con dos decimales).
   - Persona que pagó el gasto.
   - Tipo de división elegida (*todos por igual*, *solo algunos por igual* o *montos exactos*).
   - Lista de cuánto le corresponde pagar a cada persona en ese gasto.
   - Fecha y hora en que se anotó.
4. **Pago registrado (liquidación):**
   - Persona que entregó el dinero.
   - Persona que recibió el dinero.
   - Monto pagado en dólares (`USD`).
   - Fecha y hora del registro.

---

## 7. Fuera de alcance (Primera versión)

Quedan explícitamente excluidos de esta primera versión:

- Cuentas de usuario, contraseñas o enlaces de invitación para los amigos del grupo.
- Pagos reales dentro de la aplicación o conexión con bancos / tarjetas.
- Cámara o subida de fotos de recibos / facturas.
- Múltiples monedas o conversión de divisas (todo funciona únicamente en dólares `$`).
- Chat o comentarios dentro de la aplicación.
- Gráficas, estadísticas por categoría o reportes visuales complejos.
- Notificaciones push o recordatorios automáticos por correo o SMS.


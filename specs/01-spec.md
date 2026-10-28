# Especificación de Producto: Cuentas Claras (v1 - MVP)

## 1. Problema

### Contexto
Al organizar salidas sociales, viajes de fin de semana, cenas o eventos puntuales entre amigos, una sola persona (la organizadora) suele asumir la mayoría de los pagos anticipados o compras compartidas. Al finalizar la actividad, la organizadora recopila recibos y realiza los cálculos en una hoja de cálculo tradicional.

### Puntos de Dolor
1. **Pérdida de gastos pequeños:** Los gastos imprevistos menores (propinas, estacionamiento, compras rápidas) se olvidan fácilmente al no registrarse al instante.
2. **Divisiones no equitativas:** No todos los participantes consumen lo mismo ni asisten a todas las actividades (por ejemplo, alguien no fue a una cena o no consume bebidas alcohólicas), lo que vuelve confuso el cálculo manual.
3. **Falta de adopción de herramientas complejas:** Los amigos no abren ni entienden las hojas de cálculo compartidas.
4. **Incertidumbre en los cobros:** La organizadora pierde el control de quién ya pagó y quién sigue debiendo.
5. **Retraso en los reembolsos:** La falta de claridad y simplicidad provoca que las deudas tarden semanas en saldarse.

---

## 2. Usuarios y Roles

### 2.1. Usuaria Organizadora (Rol Activo)
* **Perfil:** La persona responsable de coordinar el viaje/salida y registrar los gastos.
* **Acceso:** Inicia sesión con su cuenta de Google.
* **Responsabilidades:**
  * Crea y administra los grupos de viaje o salida.
  * Ingresa los nombres de los participantes.
  * Registra, edita y elimina gastos.
  * Consulta los balances y el desglose de "quién le paga a quién".
  * Registra abonos y liquidaciones cuando alguien le paga.
  * Comparte el resumen de saldos por WhatsApp.

### 2.2. Participantes / Amigos (Rol Pasivo)
* **Perfil:** Amigos que asisten a la salida o viaje.
* **Acceso:** **No requieren cuenta ni app.** No instalan nada ni inician sesión.
* **Interacción:** Reciben mensajes de texto formateados vía WhatsApp con el resumen exacto de cuánto deben transferir y a quién.

---

## 3. Historias de Usuario y Criterios de Aceptación

### HU-01: Autenticación de la Organizadora
> **Como** organizadora,  
> **quiero** iniciar sesión con mi cuenta de Google,  
> **para** mantener mis grupos y gastos guardados de forma segura sin tener que recordar contraseñas.

* **Criterio 1.1:** Si la usuaria no ha iniciado sesión, el sistema muestra una pantalla de bienvenida con un botón prominente: "Continuar con Google".
* **Criterio 1.2:** Al autenticarse correctamente, el sistema redirige a la lista de grupos de la usuaria.
* **Criterio 1.3:** La sesión permanece activa en el dispositivo hasta que la usuaria decida explícitamente cerrar sesión.

---

### HU-02: Creación y Administración de Grupos
> **Como** organizadora,  
> **quiero** crear un grupo con un nombre y agregar a los participantes solo con su nombre de pila,  
> **para** comenzar a registrar gastos de una salida sin exigirles registrarse.

* **Criterio 2.1:** Para crear un grupo, son obligatorios el nombre del grupo (ej. "Viaje a la Playa") y al menos dos participantes (incluyendo a la organizadora).
* **Criterio 2.2:** La organizadora puede renombrar el grupo en cualquier momento.
* **Criterio 2.3:** La organizadora puede corregir el nombre de cualquier participante.
* **Criterio 2.4:** Se puede agregar un nuevo participante en cualquier momento.
* **Criterio 2.5:** Se puede eliminar a un participante únicamente si **no** tiene gastos pagados ni asignaciones pendientes registradas; de lo contrario, el sistema debe alertar que primero se deben reasignar o eliminar dichos gastos.
* **Criterio 2.6:** La organizadora puede eliminar un grupo completo, solicitando confirmación explícita para evitar pérdidas accidentales.

---

### HU-03: Registro de Gastos con Diferentes Tipos de División
> **Como** organizadora,  
> **quiero** ingresar un gasto indicando monto, concepto, pagador y participantes involucrados,  
> **para** reflejar fielmente lo que cada persona consumió en el evento.

* **Criterio 3.1:** Cada gasto requiere obligatoriamente:
  * Descripción (ej. "Cena viernes").
  * Monto total en dólares (número positivo con hasta dos decimales).
  * Persona que pagó (seleccionada de la lista del grupo).
  * Modalidad de división.
* **Criterio 3.2 (División Equitativa General):** El monto total se reparte en partes iguales entre **todos** los miembros del grupo.
* **Criterio 3.3 (División Equitativa Parcial):** La organizadora selecciona a un subgrupo específico de personas (casillas de verificación) y el monto se reparte en partes iguales exclusivamente entre los seleccionados.
* **Criterio 3.4 (División por Montos Exactos):** La organizadora asigna un valor específico a cada participante. La suma de las partes individuales debe coincidir exactamente con el monto total del gasto; si hay discrepancia, el sistema no permite guardar y muestra la diferencia restante por asignar.
* **Criterio 3.5:** Al guardar el gasto, el balance del grupo se recalcula de inmediato.

---

### HU-04: Edición y Eliminación de Gastos
> **Como** organizadora,  
> **quiero** corregir o borrar un gasto registrado previamente,  
> **para** subsanar errores de digitación o cancelaciones.

* **Criterio 4.1:** Al pulsar sobre un gasto existente, se abre la vista con sus datos precargados para edición.
* **Criterio 4.2:** Se permite modificar la descripción, el monto, el pagador y el método/participantes de la división.
* **Criterio 4.3:** Al confirmar la eliminación de un gasto, el registro desaparece y los saldos del grupo se actualizan en tiempo real.

---

### HU-05: Cálculo del Mínimo de Pagos ("Quién le paga a quién")
> **Como** organizadora,  
> **quiero** que la app calcule la cantidad mínima de transferencias necesarias para liquidar el grupo,  
> **para** que nadie tenga que hacer múltiples transferencias innecesarias.

* **Criterio 5.1:** La app calcula el balance neto de cada participante:  
  $$\text{Balance neto} = \text{Total pagado} - \text{Total consumido/adeudado}$$
* **Criterio 5.2:** La suma de todos los balances netos del grupo siempre debe ser igual a cero (\$0.00).
* **Criterio 5.3:** El sistema genera una lista simplificada de transacciones recomendadas bajo el formato directo:  
  `[Nombre Deudor] paga $[Monto] a [Nombre Acreedor]`.
* **Criterio 5.4:** El número de transacciones sugeridas debe ser el mínimo matemáticamente posible para saldar todas las deudas del grupo.

---

### HU-06: Registro de Pagos y Liquidaciones
> **Como** organizadora,  
> **quiero** marcar cuando alguien ya me transfirió o le transfirió a otro,  
> **para** saber en todo momento quién sigue debiendo y quién ya quedó a mano.

* **Criterio 6.1:** En la lista de pagos sugeridos, cada elemento cuenta con una opción clara: "Marcar como pagado".
* **Criterio 6.2:** Al confirmar el pago, la deuda registrada entre esas dos partes se descuenta o cancela en los balances.
* **Criterio 6.3:** La app permite deshacer o eliminar un pago registrado por si se marcó por equivocación.
* **Criterio 6.4:** Cuando el saldo de una persona llega a \$0.00, se muestra visualmente como "Al día" o "A mano".

---

### HU-07: Compartir Saldos por WhatsApp
> **Como** organizadora,  
> **quiero** generar y enviar un mensaje de texto con los saldos directamente a WhatsApp,  
> **para** que mis amigos entiendan en segundos cuánto deben pagar sin abrir hojas de cálculo.

* **Criterio 7.1:** En la pantalla de balances existe un botón de acción principal: "Compartir por WhatsApp".
* **Criterio 7.2:** Al presionarlo, se abre WhatsApp (app nativa o web) con un mensaje prellenado que contiene:
  * Nombre del grupo.
  * Resumen individual claro (ejemplo: *Carlos debe \$25.00 a María*).
  * Lista de personas que ya están a mano.
* **Criterio 7.3:** El mensaje utiliza saltos de línea y emojis sobrios para facilitar la lectura en teléfonos celulares.

---

### HU-08: Cerrar y Reabrir un Viaje Liquidado
> **Como** organizadora,  
> **quiero** cerrar un viaje cuando todos quedan a mano y moverlo a una sección separada en modo solo lectura,  
> **para** mantener limpia mi lista de grupos activos y evitar anotar gastos por error en un viaje terminado.

* **Criterio 8.1:** La opción "Cerrar viaje" solo está disponible cuando todos los participantes del grupo están a mano (todos los balances netos en \$0.00 y sin pagos pendientes). Si aún existen saldos pendientes, no se permite cerrar el viaje.
* **Criterio 8.2:** Al cerrar un viaje, este deja de aparecer en la lista principal de grupos activos y pasa a la sección "Viajes cerrados", ubicada al final de la pantalla "Mis Grupos".
* **Criterio 8.3:** Al abrir un viaje cerrado, su detalle se muestra en modo solo lectura: se pueden consultar los gastos y los saldos, pero no se muestran las acciones "Anotar gasto" ni "Marcar pagado" (ni se permite editar o eliminar gastos, pagos o participantes).
* **Criterio 8.4:** Dentro del detalle de un viaje cerrado existe la acción "Reabrir viaje". Al seleccionarla, el viaje vuelve a la lista principal de "Mis Grupos" como grupo activo y recupera todas las acciones de edición ("Anotar gasto", "Marcar pagado" y edición del grupo).

---

## 4. Pantallas y Flujos de Navegación

### Flujo Principal
```
[Inicio de Sesión]
       │
       ▼
[Mis Grupos] ──(Crear Grupo)──► [Formulario Grupo: Nombre y Personas]
       │
       ▼
[Detalle del Grupo] (Pestaña Gastos / Pestaña Saldos)
       │
       ├──► [Registrar / Editar Gasto]
       └──► [Ver Quién le Paga a Quién & Botón WhatsApp]
```

### 4.1. Pantalla: Inicio de Sesión
* **Propósito:** Entrada única para la organizadora.
* **Elementos:**
  * Logotipo y nombre "Cuentas Claras".
  * Subtítulo explicativo breve: "Divide gastos de viajes y salidas sin hojas de cálculo".
  * Botón único: "Continuar con Google".

### 4.2. Pantalla: Mis Grupos
* **Propósito:** Lista de viajes y salidas organizados.
* **Elementos:**
  * Encabezado con foto/perfil y botón de salida de sesión.
  * Título: "Mis Grupos".
  * Lista de tarjetas limpias (una fila por grupo): nombre del grupo, número de participantes, estado general (ej. "Pendiente de cobro" o "Liquidado").
  * Botón de acción principal fijado o visible: "+ Nuevo Grupo".

### 4.3. Pantalla: Detalle del Grupo (Vista Central)
* **Propósito:** Centro de control del viaje/salida seleccionado.
* **Estructura en dos pestañas principales:**
  1. **Pestaña "Gastos":**
     * Total acumulado del grupo en dólares (\$XX.XX) con tipografía grande.
     * Lista cronológica de gastos: concepto, quién pagó, monto y botón para ver/editar.
     * Botón de acción principal: "+ Anotar Gasto".
  2. **Pestaña "Saldos y Pagos":**
     * Resumen de balances individuales:
       * Personas a las que les deben: monto en **verde**.
       * Personas que deben: monto en **rojo suave**.
       * Personas en \$0.00: etiqueta "Al día".
     * Bloque "Quién le paga a quién": lista de transferencias pendientes con botón "Registrar pago".
     * Botón de acción principal: "Compartir por WhatsApp".

### 4.4. Pantalla / Modal: Formulario de Gasto
* **Propósito:** Registro o edición de un gasto.
* **Elementos:**
  * Campo numérico grande: `$ 0.00` (con foco inmediato).
  * Campo de texto: Descripción (ej. "Gasolina", "Cena tacos").
  * Selector desplegable o chips: "¿Quién pagó?".
  * Selector de tipo de división:
    1. *Todos por igual* (opción por defecto).
    2. *Solo algunos* (muestra lista de casillas para marcar participantes).
    3. *Montos exactos* (muestra lista de participantes con campo de monto para cada uno y validador de suma total).
  * Botón de acción principal: "Guardar Gasto".
  * (Si es edición) Enlace secundario: "Eliminar este gasto" en texto discreto.

### 4.5. Pantalla / Configuración del Grupo: Participantes
* **Propósito:** Ajustar miembros y datos del grupo.
* **Elementos:**
  * Campo de edición para el nombre del grupo.
  * Lista de participantes con opción de editar texto de nombre.
  * Campo "+ Agregar persona".
  * Botón de advertencia al final: "Eliminar grupo".

---

## 5. Reglas de Interfaz y Experiencia de Usuario (UI/UX)

1. **Enfoque Mobile-First PWA:**
   * Diseñada primordialmente para pantallas de teléfono móvil (360px a 430px de ancho).
   * Compatible con modo instalación en pantalla de inicio (icono propio, pantalla completa sin barras del navegador).
2. **Estética Bancaria y Limpia:**
   * Fondo claro (blancos y grises neutros muy sutiles).
   * Alto contraste tipográfico para legibilidad en exteriores bajo la luz del sol.
   * Cero decoraciones superfluas o sombras pesadas.
3. **Código de Colores Funcional:**
   * **Verde positivo:** Utilizado exclusivamente para números que representan dinero a favor (lo que deben pagarle a la persona).
   * **Rojo suave / terracota:** Utilizado exclusivamente para deudas pendientes (lo que la persona debe pagar).
   * **Gris neutro:** Para saldos en cero (\$0.00).
4. **Tipografía y Jerarquía:**
   * Números de dinero en tamaño grande y fuente monoespaciada o de caja fija para evitar bailes de alineación.
   * Textos directos, sin términos contables complicados (usar "Te deben", "Debes", "Pagó", "Quedó a mano").
5. **Regla de "Una sola acción principal":**
   * Cada pantalla o vista debe tener un único botón primario visualmente dominante (ej. "+ Nuevo Grupo", "+ Anotar Gasto", "Guardar Gasto", "Compartir por WhatsApp").
   * Acciones secundarias o destructivas se presentan como enlaces de texto discretos o en menús contextuales.
6. **Estructura Plana:**
   * **Prohibido:** Diseñar tarjetas dentro de tarjetas (evitar cajas anidadas).
   * Uso de listas limpias con separadores delgados en lugar de bloques complejos.

---

## 6. Modelo de Datos en Lenguaje Simple

*No define tablas SQL ni colecciones de base de datos técnica, sino la relación lógica de la información:*

1. **Usuario Organizadora:**
   * Identificador único de Google.
   * Nombre completo.
   * Correo electrónico.

2. **Grupo:**
   * Nombre del evento o salida (ej. "Fin de semana en Cuernavaca").
   * Fecha de creación.
   * Moneda fija: Dólares estadounidenses (USD).
   * Lista de participantes asociados.

3. **Participante:**
   * Nombre de pila o alias visible en el grupo (ej. "Sofía", "Carlos").
   * Indicador de si corresponde a la cuenta de la organizadora o es un amigo invitado sin cuenta.

4. **Gasto:**
   * Grupo al que pertenece.
   * Descripción del gasto.
   * Monto total en dólares.
   * Fecha y hora de registro.
   * Participante que realizó el pago.
   * Tipo de división (*Todos por igual*, *Subconjunto por igual*, *Montos exactos*).
   * Lista de asignaciones (quiénes participan de este gasto y qué monto le corresponde a cada uno).

5. **Pago / Liquidación:**
   * Grupo al que pertenece.
   * Participante que entrega el dinero (deudor).
   * Participante que recibe el dinero (acreedor).
   * Monto transferido.
   * Fecha en que se marcó el pago.

---

## 7. Fuera de Alcance (Exclusiones Explícitas para v1 - MVP)

Las siguientes funcionalidades quedan **estrictamente descartadas** para la primera versión para garantizar rapidez de entrega y simplicidad de uso:

*  **Cuentas o accesos para amigos:** No hay invitaciones por email ni registro para nadie excepto la organizadora.
*  **Procesamiento de pagos integrados:** No hay conexión con Stripe, PayPal, SPEI, Venmo, Bizum ni bancos. Los pagos ocurren fuera de la app.
*  **Escaneo de recibos por cámara / OCR:** No se procesan fotos de tickets; todo monto se digita a mano.
*  **Múltiples divisas / Tipo de cambio:** Todo se maneja exclusivamente en dólares estadounidenses (USD).
*  **Chat interno:** La comunicación se delega íntegramente a WhatsApp mediante el texto generado.
*  **Gráficas estadísticas o presupuestos:** No se incluirán gráficos de pastel ni reportes de categorías de consumo.
*  **Notificaciones push automáticas o recordatorios programados:** No se enviarán mensajes automáticos desatendidos.

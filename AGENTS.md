# Reglas para el agente - Cuentas Claras

## Fuente de verdad
- La especificacion esta en specs/01-spec.md, el plan en specs/02-plan.md y las tareas en specs/03-tareas.md.
- Si algo no esta en la spec, preguntame antes de construirlo. No agregues funciones por tu cuenta.
- Si una tarea contradice la spec o el plan, detente y avisame.

## Como trabajar
- Haz UNA tarea de specs/03-tareas.md a la vez, en orden.
- Al terminar una tarea: verificala con su "Como verificar", marca su casilla y haz un commit con un mensaje claro en espanol.
- No digas que algo esta listo sin probarlo. Dime como lo probaste y que viste.
- Si algo falla dos veces seguidas, detente y explicame el problema en lenguaje simple.
- Los pasos en las consolas web (Firebase, GitHub, Vercel) los hago yo: dame instrucciones paso a paso.
- La herramienta de Firebase se usa con npx firebase (esta en devDependencies). No instales nada de forma global.
- Nunca detengas procesos que no iniciaste. Si un puerto esta ocupado, usa otro y dime cual.
- Abre la app local en http://localhost (con su puerto), no en 127.0.0.1: Firebase solo deja entrar con Google desde localhost.
- No crees repositorios en GitHub ni hagas push si no te lo pido. Git local si: haz un commit por tarea.

## Producto
- Interfaz en espanol, con tuteo. Codigo y nombres tecnicos en ingles.
- Una sola accion principal por pantalla. Sin tarjetas dentro de tarjetas. Menos es mas.
- Sin emojis: usa iconos SVG de lucide-react.
- Dinero en dolares con dos decimales ($20.00). Calcula en centavos para evitar errores de redondeo.
- La app no llama a ningun modelo de IA ni a la API de Gemini.
- Mobile first: todo se ve bien en un celular de 360 px, sin scroll horizontal y con botones de al menos 44 px.
- Los mensajes de error dicen que paso y como arreglarlo.

## Seguridad
- Nunca escribas llaves ni contrasenas en el codigo. Usa variables de entorno (.env) y un .env.example con los nombres, sin los valores.
- Las reglas de Firestore dejan leer y escribir un grupo, sus gastos y sus pagos solo a su duena (ownerId).
- Si cambias firestore.rules, corre npm run test:rules antes de decir que esta listo.

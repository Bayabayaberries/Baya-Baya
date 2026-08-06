# Bot de WhatsApp — Baya Baya (miel y arándanos)

## Qué hace
Un cliente escribe "hola" a tu WhatsApp → el bot le muestra un menú → elige productos
de miel o arándanos → arma el carrito → da su dirección → el bot le genera un link de
pago de Wompi automáticamente.

## Parte 1 — Crear tu cuenta de WhatsApp Business API (Meta)

1. Entra a https://developers.facebook.com y crea una cuenta de desarrollador (usa tu Facebook).
2. Click en "Mis apps" → "Crear app" → elige el tipo **"Empresa"**.
3. Dentro de tu app, busca el producto **WhatsApp** y dale "Configurar".
4. Meta te da automáticamente:
   - Un **número de prueba** de WhatsApp (gratis, para probar antes de usar tu número real).
   - Un **Token de acceso temporal** (dura 24h, sirve para probar).
   - El **Phone Number ID** (un número largo, identifica tu línea de WhatsApp).
5. Copia esos dos valores a tu archivo `.env` como `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`.
6. Para agregar tu número real de negocio (no el de prueba), ve a "Administrar números de teléfono" → "Agregar número" y sigue la verificación por SMS o llamada.
7. Cuando quieras usar el bot en serio (no solo pruebas), genera un **token permanente**: eso se hace creando un "System User" en Meta Business Suite. Te puedo guiar en ese paso cuando llegues ahí.

## Parte 2 — Conectar tu Wompi

1. Crea tu cuenta en https://wompi.co (necesitas NIT o cédula si vendes como persona natural con actividad económica).
2. En el panel de Wompi, ve a "Desarrolladores" → copia tu **Llave privada de pruebas** (`prv_test_...`).
3. Pégala en tu `.env` como `WOMPI_PRIVATE_KEY`, y deja `WOMPI_ENV=sandbox` mientras pruebas.
4. Cuando todo funcione, cambia a tus llaves de producción (`prv_prod_...`) y `WOMPI_ENV=production`.

## Parte 3 — Correr el bot en tu computador (para probar)

```bash
npm install
cp .env.example .env
# edita .env con tus datos reales
npm start
```

Esto levanta el servidor en tu computador, pero **Meta no puede llegar hasta tu
computador desde internet** — por eso necesitas publicarlo (parte 4) o usar una
herramienta como `ngrok` solo para pruebas rápidas.

## Parte 4 — Publicar el bot 24/7 con Render (gratis, sin manejar servidores)

1. Sube esta carpeta a un repositorio de GitHub (puedo ayudarte con esto si nunca lo has hecho).
2. Entra a https://render.com, crea una cuenta gratis, y elige "New → Web Service".
3. Conecta tu repositorio de GitHub.
4. En "Build Command" pon `npm install`, y en "Start Command" pon `npm start`.
5. En la sección "Environment", agrega las mismas variables de tu `.env` (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, WOMPI_PRIVATE_KEY, WOMPI_ENV).
6. Al desplegar, Render te da una URL pública, algo como `https://baya-baya-bot.onrender.com`.

## Parte 5 — Conectar el webhook en Meta

1. Vuelve a tu app en developers.facebook.com → WhatsApp → Configuración.
2. En "Webhook", pon la URL: `https://tu-url-de-render.onrender.com/webhook`.
3. En "Verify token" pon la misma palabra secreta que usaste en `WHATSAPP_VERIFY_TOKEN`.
4. Dale "Verificar y guardar" (Meta llamará tu servidor automáticamente para confirmar).
5. En "Campos del webhook", activa **messages**.

¡Listo! Escríbele "hola" a tu número de WhatsApp de prueba y el bot debería responder.

## Estructura del proyecto

```
server.js          → recibe los mensajes de WhatsApp (webhook)
src/bot.js          → la lógica de la conversación (el "cerebro")
src/catalog.js       → tus productos y precios (edítalo cuando quieras)
src/session.js       → recuerda en qué paso va cada cliente
src/whatsapp.js      → funciones para enviar mensajes/botones/listas
src/wompi.js         → genera el link de pago por cada pedido
```

## Cosas para mejorar más adelante
- Guardar los pedidos en una base de datos real (ahora solo viven en memoria y se
  pierden si el servidor se reinicia).
- Confirmar el pago automáticamente con un **webhook de Wompi** (Wompi te avisa cuando
  el cliente sí pagó, y ahí puedes notificar al cliente y a ti mismo).
- Agregar fotos de los productos en la lista de WhatsApp.

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { handleIncomingMessage } = require('./src/bot');

const app = express();
app.use(express.json());

// Permite que la tienda web (alojada en otro sitio, ej. GoDaddy) le pida
// la firma a este servidor. Si luego quieres restringirlo a tu dominio
// real, cambia el '*' por tu URL, ej: 'https://www.bayabaya.com'
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 1) VERIFICACIÓN DEL WEBHOOK
// Meta llama a esta ruta UNA VEZ, cuando configuras el webhook en el
// panel de desarrolladores, para comprobar que el servidor es tuyo.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Registro temporal para diagnosticar problemas de verificación.
  // Puedes borrar estas 2 líneas de console.log una vez que todo funcione.
  console.log('Intento de verificación recibido. Modo:', mode, '| Token recibido:', JSON.stringify(token));
  console.log('Token esperado (de la variable de entorno):', JSON.stringify(process.env.WHATSAPP_VERIFY_TOKEN));

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado correctamente ✅');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) RECEPCIÓN DE MENSAJES
// Meta envía aquí cada mensaje que un cliente le escribe a tu número.
app.post('/webhook', async (req, res) => {
  // Respondemos 200 de inmediato: Meta reintenta si no respondes rápido.
  res.sendStatus(200);

  // Registro temporal para diagnosticar: muestra TODO lo que llega,
  // aunque no sea un mensaje de texto. Bórralo cuando todo funcione.
  console.log('📩 Webhook POST recibido:', JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return; // puede ser una notificación de "leído", la ignoramos

    const from = message.from; // número del cliente
    await handleIncomingMessage(from, message);
  } catch (err) {
    console.error('Error procesando el mensaje entrante:', err);
  }
});

// 3) FIRMA DE INTEGRIDAD PARA LA TIENDA WEB
// La tienda web le pide esto al servidor ANTES de abrir el widget de Wompi.
// El "secreto de integridad" nunca debe estar en el código de la tienda
// (visible para cualquiera), por eso este cálculo vive aquí, en el servidor.
app.post('/api/wompi-signature', (req, res) => {
  try {
    const { reference, amountInCents, currency } = req.body;
    if (!reference || !amountInCents || !currency) {
      return res.status(400).json({ error: 'Faltan datos: reference, amountInCents o currency' });
    }

    const cadena = `${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash('sha256').update(cadena).digest('hex');

    res.json({ signature });
  } catch (err) {
    console.error('Error generando firma de Wompi:', err);
    res.status(500).json({ error: 'No se pudo generar la firma' });
  }
});

// Ruta simple para comprobar que el servidor está vivo
app.get('/', (req, res) => res.send('Bot de Baya Baya funcionando 🫐🍯'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));

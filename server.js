require('dotenv').config();
const express = require('express');
const { handleIncomingMessage } = require('./src/bot');

const app = express();
app.use(express.json());

// 1) VERIFICACIÓN DEL WEBHOOK
// Meta llama a esta ruta UNA VEZ, cuando configuras el webhook en el
// panel de desarrolladores, para comprobar que el servidor es tuyo.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

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

// Ruta simple para comprobar que el servidor está vivo
app.get('/', (req, res) => res.send('Bot de Baya Baya funcionando 🫐🍯'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));

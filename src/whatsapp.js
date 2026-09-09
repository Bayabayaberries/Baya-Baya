// Funciones para ENVIAR mensajes usando la API oficial de WhatsApp Cloud (Meta).
// Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api

const GRAPH_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function callGraphAPI(body) {
  const res = await fetch(GRAPH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Error de WhatsApp API:', errText);
  }
  return res;
}

// Mensaje de texto simple
async function sendText(to, text) {
  return callGraphAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

// Menú de botones (máximo 3 opciones — límite de WhatsApp)
async function sendButtons(to, bodyText, buttons) {
  // buttons: [{ id: 'ver_arandanos', title: 'Arándanos' }, ...]
  return callGraphAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

// Lista desplegable (hasta 10 opciones — mejor para catálogos)
async function sendList(to, bodyText, buttonLabel, sections) {
  // sections: [{ title: 'Arándanos', rows: [{ id, title, description }] }]
  return callGraphAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: { button: buttonLabel, sections },
    },
  });
}

// Mensaje con PLANTILLA aprobada — la única forma de escribirle a alguien
// que no te ha escrito en las últimas 24 horas (ej: avisarte a ti mismo
// que un cliente quiere hablar con un asesor).
async function sendTemplate(to, templateName, languageCode, parameters = []) {
  return callGraphAPI({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: parameters.length
        ? [
            {
              type: 'body',
              parameters: parameters.map((text) => ({ type: 'text', text })),
            },
          ]
        : [],
    },
  });
}

module.exports = { sendText, sendButtons, sendList, sendTemplate };

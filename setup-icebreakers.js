// Corre este archivo UNA SOLA VEZ para activar el mensaje de bienvenida
// y las "ice breakers" (los botones que aparecen cuando alguien abre el
// chat contigo por primera vez, antes de escribir nada).
//
// Cómo usarlo:
//   1. Asegúrate de tener tu .env configurado (WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID)
//   2. Corre en la terminal: node setup-icebreakers.js
//
// Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-ice-breakers

require('dotenv').config();

async function setupIceBreakers() {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/conversational_automation`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enable_welcome_message: true,
      prompts: [
        'Comprar arándanos de Baya Baya',
        'Comprar miel de Oko',
      ],
      // "commands" son atajos que aparecen cuando el cliente escribe "/"
      // dentro del chat. Son opcionales, pero útiles para clientes que ya
      // te conocen y quieren ir directo al grano.
      commands: [
        { command_name: 'catalogo', command_description: 'Ver todos los productos' },
        { command_name: 'carrito', command_description: 'Ver mi pedido actual' },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error configurando conversational_automation:', data);
    return;
  }
  console.log('✅ Ice breakers y mensaje de bienvenida activados:', data);
}

setupIceBreakers();

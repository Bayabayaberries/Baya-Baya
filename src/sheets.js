// Guarda cada pedido en una hoja de Google Sheets, usando un Google Apps
// Script publicado como "aplicación web" (ver google-apps-script.js para
// las instrucciones de cómo configurarlo).

async function saveOrderToSheet({ nombre, whatsapp, productos, total, direccion, zona }) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('GOOGLE_SHEETS_WEBHOOK_URL no configurada, se omite el guardado en Sheets.');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origen: 'WhatsApp Bot',
        fecha: new Date().toISOString(),
        nombre,
        whatsapp,
        direccion,
        modo: 'Pedido único',
        presentacion: productos,
        frecuencia: 'Una vez',
        zona,
        estimado: total,
        proximaEntrega: '',
        estado: 'Pendiente',
      }),
    });
  } catch (err) {
    console.error('Error guardando el pedido en Google Sheets:', err);
  }
}

module.exports = { saveOrderToSheet };

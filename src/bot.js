const { catalog, findProduct, formatCOP, SHIPPING_MEDELLIN } = require('./catalog');
const { getSession, saveSession, resetSession } = require('./session');
const { sendText, sendButtons, sendList, sendTemplate } = require('./whatsapp');
const { createPaymentLink } = require('./wompi');
const { saveOrderToSheet } = require('./sheets');

// Número donde TÚ recibes el aviso de cada pedido nuevo.
// Este número necesita tener WhatsApp o WhatsApp Business normal
// instalado — no puede ser el mismo número conectado a la API.
const OWNER_NOTIFICATION_PHONE = '573247093735';

async function showMainMenu(to) {
  await sendButtons(to, '¡Hola! 👋 Bienvenido a *Baya Baya Berries* 🫐\n\nArándanos frescos, directo del cultivo a tu mesa.\n\n¿Qué quieres hacer?', [
    { id: 'menu_catalogo', title: 'Ver catálogo' },
    { id: 'menu_carrito', title: 'Ver mi carrito' },
    { id: 'menu_asesor', title: 'Hablar con alguien' },
  ]);
}

async function showCatalog(to, categoryKey) {
  // Si viene un categoryKey (por ahora solo "arandanos"), mostramos esa categoría.
  // Si no viene, mostramos todo (por ejemplo cuando escriben "catálogo" directamente).
  const categoriesToShow = categoryKey ? { [categoryKey]: catalog[categoryKey] } : catalog;
  const sections = Object.values(categoriesToShow).map((category) => ({
    title: category.label,
    rows: category.items.map((item) => ({
      id: `add_${item.id}`,
      title: item.name,
      description: formatCOP(item.price),
    })),
  }));
  await sendList(to, 'Elige el producto que quieres agregar a tu pedido 👇', 'Ver productos', sections);
}

function cartTotal(cart) {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = findProduct(id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

async function showCart(to, session) {
  const entries = Object.entries(session.cart);
  if (entries.length === 0) {
    await sendText(to, 'Tu carrito está vacío todavía. Escribe *catálogo* para ver los productos.');
    return;
  }
  let text = '🛒 *Tu pedido hasta ahora:*\n\n';
  for (const [id, qty] of entries) {
    const p = findProduct(id);
    text += `• ${p.name} x${qty} — ${formatCOP(p.price * qty)}\n`;
  }
  text += `\n*Total: ${formatCOP(cartTotal(session.cart))}*`;
  await sendText(to, text);
  await sendButtons(to, '¿Qué quieres hacer?', [
    { id: 'menu_catalogo', title: 'Agregar más' },
    { id: 'checkout', title: 'Finalizar pedido' },
    { id: 'vaciar_carrito', title: 'Vaciar carrito' },
  ]);
}

async function handleIncomingMessage(from, message, profileName) {
  const session = getSession(from);
  if (profileName && !session.customerName) {
    session.customerName = profileName;
  }
  const text = (message.text?.body || '').trim().toLowerCase();
  const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || null;

  // Meta dispara este tipo de mensaje cuando alguien abre el chat por
  // primera vez y aún no ha escrito nada (ahí es cuando ve los ice breakers).
  if (message.type === 'request_welcome') {
    resetSession(from);
    return showMainMenu(from);
  }

  // Comandos globales, funcionan en cualquier momento
  if (text === 'hola' || text === 'menu' || text === 'menú') {
    resetSession(from);
    return showMainMenu(from);
  }

  // Ice breaker: el mensaje que aparece la primera vez que alguien
  // abre el chat. Al tocarlo, WhatsApp lo manda como texto normal,
  // por eso lo detectamos comparando el texto.
  if (text.includes('arándanos baya baya') || text.includes('arandanos baya baya')) {
    session.step = 'choosing_category';
    saveSession(from, session);
    return showCatalog(from);
  }

  if (text === 'catálogo' || text === 'catalogo' || buttonId === 'menu_catalogo') {
    session.step = 'choosing_category';
    saveSession(from, session);
    return showCatalog(from);
  }
  if (text === 'carrito' || buttonId === 'menu_carrito') {
    return showCart(from, session);
  }
  if (buttonId === 'menu_asesor') {
    await sendText(from, 'Listo, en un momento te escribe alguien de nuestro equipo por este mismo chat 🙌');
    await sendTemplate(OWNER_NOTIFICATION_PHONE, 'aviso_asesor', 'es_CO', [from]);
    return;
  }
  if (buttonId === 'vaciar_carrito') {
    resetSession(from);
    await sendText(from, 'Vaciamos tu carrito. Escribe *catálogo* para empezar de nuevo.');
    return;
  }

  // Agregar producto desde la lista del catálogo
  if (buttonId && buttonId.startsWith('add_')) {
    const productId = buttonId.replace('add_', '');
    const product = findProduct(productId);
    if (!product) return sendText(from, 'No encontré ese producto, intenta de nuevo con *catálogo*.');
    session.pendingProductId = productId;
    session.step = 'choosing_qty';
    saveSession(from, session);
    return sendText(from, `¿Cuántas unidades de *${product.name}* quieres? (responde solo con el número)`);
  }

  // Esperando la cantidad
  if (session.step === 'choosing_qty') {
    const qty = parseInt(text, 10);
    if (!qty || qty <= 0) {
      return sendText(from, 'Por favor responde solo con un número, por ejemplo: 2');
    }
    session.cart[session.pendingProductId] = (session.cart[session.pendingProductId] || 0) + qty;
    session.pendingProductId = null;
    session.step = 'menu';
    saveSession(from, session);
    await sendText(from, '¡Agregado! ✅');
    return showCart(from, session);
  }

  // Finalizar pedido → pedir dirección → generar link de pago
  if (buttonId === 'checkout') {
    if (Object.keys(session.cart).length === 0) {
      return sendText(from, 'Tu carrito está vacío. Escribe *catálogo* para agregar productos.');
    }
    session.step = 'awaiting_address';
    saveSession(from, session);
    return sendText(from, '📍 Perfecto, ¿cuál es la dirección de entrega? (barrio, calle/carrera, ciudad)');
  }

  if (session.step === 'awaiting_address') {
    session.address = message.text?.body || '';
    session.step = 'awaiting_shipping_city';
    saveSession(from, session);
    return sendButtons(from, '¿Tu entrega es dentro de la ciudad de Medellín?', [
      { id: 'shipping_medellin', title: 'Sí, en Medellín' },
      { id: 'shipping_otra', title: 'No, otra ciudad' },
    ]);
  }

  if (session.step === 'awaiting_shipping_city' && (buttonId === 'shipping_medellin' || buttonId === 'shipping_otra')) {
    const shippingCost = buttonId === 'shipping_medellin' ? SHIPPING_MEDELLIN : 0;
    const subtotal = cartTotal(session.cart);
    const total = subtotal + shippingCost;

    let resumen = `Subtotal productos: ${formatCOP(subtotal)}\n`;
    resumen += shippingCost > 0
      ? `Domicilio (Medellín): ${formatCOP(shippingCost)}\n`
      : `Domicilio: a coordinar con el transportador\n`;
    resumen += `\n*Total a pagar: ${formatCOP(total)}*`;

    await sendText(from, `Gracias, ya casi terminamos.\n\n${resumen}\nGenerando tu link de pago... ⏳`);

    let paymentUrl;
    try {
      paymentUrl = await createPaymentLink({
        amountInCents: total * 100,
        reference: `pedido-${from}-${Date.now()}`,
        customerPhone: from,
      });
      await sendText(from, `Aquí está tu link de pago seguro (Wompi) 👇\n${paymentUrl}\n\nApenas se confirme el pago, preparamos tu pedido para *${session.address}*.`);
    } catch (err) {
      console.error('Error generando link de Wompi:', err);
      await sendText(from, 'Tuvimos un problema generando el link de pago automático. En un momento un asesor te contacta para coordinar el pago 🙏');
    }

    // Armamos el detalle de productos, lo usan tanto el aviso como Sheets.
    let detalleProductos = '';
    for (const [id, qty] of Object.entries(session.cart)) {
      const p = findProduct(id);
      detalleProductos += `${p.name} x${qty}, `;
    }

    // Le avisamos al dueño del negocio que llegó un pedido nuevo, usando
    // una plantilla aprobada. Esto va en su PROPIO try/catch: si falla
    // (por ejemplo, si la plantilla aún no está aprobada por Meta), no
    // debe afectar el mensaje de pago que el cliente ya recibió.
    try {
      await sendTemplate(OWNER_NOTIFICATION_PHONE, 'aviso_pedido', 'es', [
        from,
        formatCOP(total),
        `${detalleProductos}${session.address}`,
      ]);
    } catch (err) {
      console.error('Error mandando el aviso de pedido al dueño:', err);
    }

    // Guardamos el pedido en Google Sheets, también en su propio try/catch
    // por la misma razón: que no dependa de que lo anterior haya salido bien.
    try {
      await saveOrderToSheet({
        nombre: session.customerName || '',
        whatsapp: from,
        productos: detalleProductos,
        total: formatCOP(total),
        direccion: session.address,
        zona: shippingCost > 0 ? 'Medellín' : 'Otra ciudad',
      });
    } catch (err) {
      console.error('Error guardando el pedido en Google Sheets:', err);
    }

    resetSession(from);
    return;
  }

  // Si no coincide con nada conocido, mostramos el menú
  return showMainMenu(from);
}

module.exports = { handleIncomingMessage };

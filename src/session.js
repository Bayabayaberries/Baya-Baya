// Guarda el estado de cada cliente en memoria (por número de WhatsApp).
// NOTA: esto se borra si el servidor se reinicia. Para producción real,
// lo ideal es cambiar este objeto por una tabla en una base de datos
// (por ejemplo, una tabla simple en Postgres, Supabase, o incluso un
// archivo JSON en disco). La forma de usar getSession/saveSession no
// cambiaría, solo lo que hay adentro de las funciones.

const sessions = new Map();

function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      step: 'menu', // menu | choosing_category | choosing_qty | cart | awaiting_address
      cart: {}, // { productId: qty }
      pendingProductId: null,
      address: null,
    });
  }
  return sessions.get(phone);
}

function saveSession(phone, session) {
  sessions.set(phone, session);
}

function resetSession(phone) {
  sessions.set(phone, {
    step: 'menu',
    cart: {},
    pendingProductId: null,
    address: null,
  });
}

module.exports = { getSession, saveSession, resetSession };

// Genera un link de pago único por pedido usando la API de Wompi.
// Documentación: https://docs.wompi.co/en/docs/colombia/links-de-pago/

async function createPaymentLink({ amountInCents, reference, customerPhone }) {
  // WOMPI_ENV = 'sandbox' mientras pruebas (usa llaves prv_test_...)
  // WOMPI_ENV = 'production' cuando ya estés listo para cobrar de verdad (llaves prv_prod_...)
  const baseUrl =
    process.env.WOMPI_ENV === 'production'
      ? 'https://production.wompi.co/v1/payment_links'
      : 'https://sandbox.wompi.co/v1/payment_links';

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Pedido Baya Baya`,
      description: `Pedido realizado por WhatsApp (${customerPhone})`,
      single_use: true,
      collect_shipping: false,
      currency: 'COP',
      amount_in_cents: amountInCents,
      sku: reference,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Wompi respondió con error: ${errText}`);
  }

  const data = await res.json();
  const linkId = data.data.id;
  // El id que devuelve Wompi se usa para construir la URL pública del link,
  // y también para poder identificar después el pago que se haga con él.
  return {
    url: `https://checkout.wompi.co/l/${linkId}`,
    linkId,
  };
}

module.exports = { createPaymentLink };

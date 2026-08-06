// Catálogo de productos. Edita precios y nombres libremente.
// El "id" debe ser único y corto — se usa internamente, no lo ve el cliente.

const catalog = {
  arandanos: {
    label: '🫐 Arándanos — Baya Baya Berries',
    brand: 'Baya Baya Berries',
    items: [
      { id: 'ar_125', name: 'Arándanos 125g', price: 9000 },
      { id: 'ar_250', name: 'Arándanos 250g', price: 12600 },
      { id: 'ar_500', name: 'Arándanos 500g', price: 35000 },
    ],
  },
  miel: {
    label: '🍯 Miel — Oko Honey',
    brand: 'Oko Honey',
    items: [
      { id: 'mi_pura_350', name: 'Miel Pura 350g', price: 25000 },
      { id: 'mi_pura_482', name: 'Miel Pura 482g', price: 31000 },
      { id: 'mi_picante_bajo', name: 'Miel Picante Bajo 350g', price: 27000 },
      { id: 'mi_picante_medio', name: 'Miel Picante Medio 350g', price: 27000 },
      { id: 'mi_picante_alto', name: 'Miel Picante Alto 350g', price: 27000 },
    ],
  },
};

// Costo del domicilio si la entrega es dentro de Medellín.
// Fuera de Medellín, por ahora no se cobra automático (coordinar aparte).
const SHIPPING_MEDELLIN = 5000;

function findProduct(id) {
  for (const category of Object.values(catalog)) {
    const found = category.items.find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

function formatCOP(n) {
  return '$' + n.toLocaleString('es-CO') + ' COP';
}

module.exports = { catalog, findProduct, formatCOP, SHIPPING_MEDELLIN };

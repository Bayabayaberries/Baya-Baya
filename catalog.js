// Catálogo de productos. Edita precios y nombres libremente.
// El "id" debe ser único y corto — se usa internamente, no lo ve el cliente.

const catalog = {
  arandanos: {
    label: '🫐 Arándanos — Baya Baya',
    brand: 'Baya Baya',
    items: [
      { id: 'ar_250', name: 'Arándanos frescos 250g', price: 9900 },
      { id: 'ar_500', name: 'Arándanos frescos 500g', price: 17900 },
      { id: 'ar_1kg', name: 'Arándanos frescos 1kg', price: 32900 },
      { id: 'ar_caja', name: 'Caja mayorista 5kg', price: 139900 },
    ],
  },
  miel: {
    label: '🍯 Miel — Oko',
    brand: 'Oko',
    items: [
      { id: 'mi_250', name: 'Miel pura 250ml', price: 15900 },
      { id: 'mi_500', name: 'Miel pura 500ml', price: 27900 },
      { id: 'mi_1l', name: 'Miel pura 1 litro', price: 49900 },
      { id: 'mi_panal', name: 'Miel en panal 500g', price: 35900 },
    ],
  },
};

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

module.exports = { catalog, findProduct, formatCOP };

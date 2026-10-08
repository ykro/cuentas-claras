/**
 * Utilidades para manejo seguro de moneda y formato en dólares.
 * Se calcula internamente en centavos para evitar errores de redondeo de punto flotante.
 */

/**
 * Convierte un valor en dólares (float o string) a centavos enteros.
 * @param {number|string} dollars 
 * @returns {number} centavos enteros
 */
export function toCents(dollars) {
  const num = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convierte centavos enteros a valor en dólares (float).
 * @param {number} cents 
 * @returns {number} dólares
 */
export function toDollars(cents) {
  if (isNaN(cents)) return 0;
  return cents / 100;
}

/**
 * Formatea un valor a texto en formato monetario USD ($20.00).
 * Puede recibir dólares o centavos si se especifica isCents.
 * @param {number} amount 
 * @param {boolean} isCents 
 * @returns {string} Ejemplo: "$20.00"
 */
export function formatCurrency(amount, isCents = false) {
  const cents = isCents ? Math.round(amount) : toCents(amount);
  const dollars = Math.abs(cents) / 100;
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${dollars.toFixed(2)}`;
}

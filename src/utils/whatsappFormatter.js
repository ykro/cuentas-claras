/**
 * Formatea el resumen de deudas y saldos para compartir por WhatsApp
 * mediante el enlace nativo de wa.me sin dependencias externas ni emojis.
 */

/**
 * Genera el texto formateado en Markdown compatible con WhatsApp.
 * 
 * @param {string} groupName 
 * @param {number} totalExpenses (en dólares)
 * @param {Array<Object>} balances 
 * @param {Array<Object>} transactions 
 * @returns {string} Texto listo para WhatsApp
 */
export function generateWhatsAppMessage(groupName, totalExpenses, balances, transactions) {
  const formattedTotal = Number(totalExpenses).toFixed(2);
  let message = `*Cuentas Claras - ${groupName}*\n`;
  message += `Total del viaje: $${formattedTotal}\n\n`;

  message += `*Quién le paga a quién:*\n`;
  if (!transactions || transactions.length === 0) {
    message += `• Todos están al día, no hay pagos pendientes.\n`;
  } else {
    transactions.forEach(t => {
      message += `• ${t.fromName} le paga $${t.amount.toFixed(2)} a ${t.toName}\n`;
    });
  }

  // Lista de personas que ya quedaron al día ($0.00)
  const settled = (balances || []).filter(b => b.netBalanceCents === 0);
  if (settled.length > 0) {
    message += `\n*Al día:*\n`;
    settled.forEach(s => {
      message += `• ${s.name}\n`;
    });
  }

  return message;
}

/**
 * Construye la URL para abrir WhatsApp con el mensaje prellenado.
 * 
 * @param {string} groupName 
 * @param {number} totalExpenses 
 * @param {Array<Object>} balances 
 * @param {Array<Object>} transactions 
 * @returns {string} Enlace wa.me
 */
export function getWhatsAppShareUrl(groupName, totalExpenses, balances, transactions) {
  const text = generateWhatsAppMessage(groupName, totalExpenses, balances, transactions);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

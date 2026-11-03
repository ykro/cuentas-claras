// WhatsApp summary: builds the message and the wa.me link (free, no API, no server).
import { formatCents } from './balances.js';

/**
 * @param {{ groupName: string, totalCents: number,
 *   transfers: { fromMemberId: string, toMemberId: string, amountCents: number }[],
 *   nameOf: (id: string) => string }} summary
 * @returns {string}
 */
export function buildSummaryMessage({ groupName, totalCents, transfers, nameOf }) {
  const lines = [`Cuentas Claras - ${groupName}`, `Total: ${formatCents(totalCents)}`, ''];
  if (transfers.length === 0) {
    lines.push('Todos estamos a mano. No hay pagos pendientes.');
  } else {
    lines.push('Quién le paga a quién:');
    for (const t of transfers) {
      lines.push(`• ${nameOf(t.fromMemberId)} → ${nameOf(t.toMemberId)}: ${formatCents(t.amountCents)}`);
    }
  }
  return lines.join('\n');
}

/** Link that opens WhatsApp with the text ready to send (the user picks the chat). */
export function whatsappUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}


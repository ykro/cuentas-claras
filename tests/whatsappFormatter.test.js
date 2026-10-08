import { describe, it, expect } from 'vitest';
import { generateWhatsAppMessage, getWhatsAppShareUrl } from '../src/utils/whatsappFormatter.js';

describe('Formateador de mensaje para WhatsApp', () => {
  it('debe generar el texto estructurado correctamente sin emojis', () => {
    const groupName = 'Viaje Fin de Semana';
    const totalExpenses = 274.00;
    const balances = [
      { id: 'p1', name: 'María', netBalanceCents: 10700 },
      { id: 'p2', name: 'Carlos', netBalanceCents: 0 }, // al día
      { id: 'p3', name: 'Beto', netBalanceCents: -5000 },
    ];
    const transactions = [
      { fromName: 'Beto', toName: 'María', amount: 50.00 },
    ];

    const message = generateWhatsAppMessage(groupName, totalExpenses, balances, transactions);

    expect(message).toContain('*Cuentas Claras - Viaje Fin de Semana*');
    expect(message).toContain('Total del viaje: $274.00');
    expect(message).toContain('*Quién le paga a quién:*');
    expect(message).toContain('• Beto le paga $50.00 a María');
    expect(message).toContain('*Al día:*');
    expect(message).toContain('• Carlos');
  });

  it('debe generar una URL válida de wa.me con encodeURIComponent', () => {
    const url = getWhatsAppShareUrl(
      'Salida',
      50,
      [],
      [{ fromName: 'Beto', toName: 'María', amount: 25 }]
    );

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('• Beto le paga $25.00 a María'));
  });
});

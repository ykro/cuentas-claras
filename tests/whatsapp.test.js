import { describe, expect, it } from 'vitest';
import { buildSummaryMessage, whatsappUrl } from '../src/lib/whatsapp.js';
import { computeBalances, formatBalance, settleUp, splitEqually } from '../src/lib/balances.js';

// Test data from specs/03-tareas.md: "Viaje a Antigua".
const names = { m_1: 'Yo', m_2: 'Carlos', m_3: 'Beto', m_4: 'Luisa' };
const ids = Object.keys(names);
const expenses = [
  { amountCents: 18000, paidByMemberId: 'm_1', participantIds: ids, splitsCents: splitEqually(18000, ids) },
  { amountCents: 5400, paidByMemberId: 'm_2', participantIds: ['m_1', 'm_2', 'm_4'], splitsCents: splitEqually(5400, ['m_1', 'm_2', 'm_4']) },
  { amountCents: 4000, paidByMemberId: 'm_4', participantIds: ids, splitsCents: { m_1: 1000, m_2: 1000, m_3: 1500, m_4: 500 } },
];
const nameOf = (id) => names[id];

describe('Mensaje para WhatsApp (HU-07)', () => {
  it('Incluye Viaje a Antigua, Total: $274.00 y los 3 pagos', () => {
    const transfers = settleUp(computeBalances(ids, expenses, []));
    const text = buildSummaryMessage({ groupName: 'Viaje a Antigua', totalCents: 27400, transfers, nameOf });
    expect(text).toBe(
      [
        'Cuentas Claras - Viaje a Antigua',
        'Total: $274.00',
        '',
        'Quién le paga a quién:',
        '• Beto → Yo: $60.00',
        '• Luisa → Yo: $28.00',
        '• Carlos → Yo: $19.00',
      ].join('\n'),
    );
  });

  it('Después de que Beto paga, el mensaje ya no lo incluye', () => {
    const payments = [{ fromMemberId: 'm_3', toMemberId: 'm_1', amountCents: 6000 }];
    const transfers = settleUp(computeBalances(ids, expenses, payments));
    const text = buildSummaryMessage({ groupName: 'Viaje a Antigua', totalCents: 27400, transfers, nameOf });
    expect(text).not.toMatch(/Beto/);
    expect(text).toMatch(/• Luisa → Yo: \$28\.00/);
  });

  it('Si todos están en cero, dice que el grupo está a mano', () => {
    const text = buildSummaryMessage({ groupName: 'Viaje a Antigua', totalCents: 27400, transfers: [], nameOf });
    expect(text).toMatch(/Todos estamos a mano/);
    expect(text).not.toMatch(/Quién le paga a quién/);
  });

  it('El enlace wa.me lleva el texto codificado y se puede decodificar igual', () => {
    const text = 'Cuentas Claras - Viaje a Antigua\nTotal: $274.00\n• Beto → Yo: $60.00';
    const url = whatsappUrl(text);
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe(text);
    expect(url).not.toMatch(/\s/);
  });
});

describe('Saldos con signo para la pantalla', () => {
  it('+$107.00, −$19.00 (signo menos real) y $0.00', () => {
    expect(formatBalance(10700)).toBe('+$107.00');
    expect(formatBalance(-1900)).toBe('\u2212$19.00');
    expect(formatBalance(0)).toBe('$0.00');
  });
});


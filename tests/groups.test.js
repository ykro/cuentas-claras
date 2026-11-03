import { describe, expect, it } from 'vitest';
import { newMemberId, peopleLabel, validateGroupDraft } from '../src/lib/groups.js';

const draft = (name, names) => ({
  name,
  members: names.map((n, i) => ({ id: `m_${i + 1}`, name: n })),
});

describe('Crear y editar grupos (HU-02)', () => {
  it('Viaje a Antigua con Yo, Carlos, Beto y Luisa se puede guardar', () => {
    const result = validateGroupDraft(draft('Viaje a Antigua', ['Yo', 'Carlos', 'Beto', 'Luisa']));
    expect(result.ok).toBe(true);
    expect(result.fields).toEqual({
      name: 'Viaje a Antigua',
      memberIds: ['m_1', 'm_2', 'm_3', 'm_4'],
      members: [
        { id: 'm_1', name: 'Yo' },
        { id: 'm_2', name: 'Carlos' },
        { id: 'm_3', name: 'Beto' },
        { id: 'm_4', name: 'Luisa' },
      ],
    });
  });

  it('El nombre del grupo es obligatorio', () => {
    const result = validateGroupDraft(draft('   ', ['Yo', 'Carlos']));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/nombre del grupo/);
  });

  it('Un grupo con solo Yo no se guarda y explica que faltan personas', () => {
    const result = validateGroupDraft(draft('Solo yo', ['Yo', '']));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/al menos 2 personas/);
  });

  it('Carlos repetido no se guarda, aunque cambien mayúsculas o espacios', () => {
    const result = validateGroupDraft(draft('Viaje', ['Yo', 'Carlos', ' carlos ']));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/"carlos" está repetido/);
  });

  it('Las filas nuevas en blanco se ignoran y los nombres se limpian de espacios', () => {
    const result = validateGroupDraft(draft('  Viaje  ', [' Yo ', 'Carlos', '']));
    expect(result.ok).toBe(true);
    expect(result.fields.name).toBe('Viaje');
    expect(result.fields.members).toEqual([
      { id: 'm_1', name: 'Yo' },
      { id: 'm_2', name: 'Carlos' },
    ]);
  });

  it('Renombrar Carlos -> Carlitos conserva su id fijo', () => {
    const result = validateGroupDraft(draft('Viaje', ['Yo', 'Carlitos', 'Beto']), ['m_1', 'm_2', 'm_3']);
    expect(result.fields.members[1]).toEqual({ id: 'm_2', name: 'Carlitos' });
  });

  it('Una persona que ya existía no puede quedar sin nombre', () => {
    const result = validateGroupDraft(draft('Viaje', ['Yo', '', 'Beto']), ['m_1', 'm_2', 'm_3']);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sin nombre/);
  });

  it('El nombre del grupo no puede pasar de 80 caracteres', () => {
    const result = validateGroupDraft(draft('x'.repeat(81), ['Yo', 'Carlos']));
    expect(result.ok).toBe(false);
  });
});

describe('Identificadores y textos', () => {
  it('Cada persona nueva recibe un id distinto con formato m_xxxxxxxx', () => {
    const ids = new Set(Array.from({ length: 200 }, newMemberId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^m_[a-z0-9]{8}$/);
  });

  it('Dice "4 personas" y "1 persona"', () => {
    expect(peopleLabel(4)).toBe('4 personas');
    expect(peopleLabel(1)).toBe('1 persona');
  });
});


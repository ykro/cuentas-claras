// Pure helpers for groups and people (no Firebase here, so they can be tested).

export const MAX_GROUP_NAME = 80;
export const MAX_PERSON_NAME = 40;
export const MAX_MEMBERS = 50;

/** Fixed internal id for a person, e.g. "m_k3x9q2ab". Never changes when the name changes. */
export function newMemberId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `m_${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

/**
 * Validates what the organizer typed and returns the clean data to save.
 * Blank rows that were just added are ignored; a person who already existed
 * cannot be left without a name.
 * @param {{ name: string, members: { id: string, name: string }[] }} draft
 * @param {string[]} existingIds ids already saved in the group (empty for a new group)
 * @returns {{ ok: true, fields: { name: string, members: {id:string,name:string}[], memberIds: string[] } }
 *   | { ok: false, error: string }}
 */
export function validateGroupDraft(draft, existingIds = []) {
  const name = draft.name.trim();
  if (name === '') {
    return { ok: false, error: 'Escribe el nombre del grupo, por ejemplo: Viaje a Antigua.' };
  }
  if (name.length > MAX_GROUP_NAME) {
    return { ok: false, error: `El nombre del grupo es muy largo. Usa ${MAX_GROUP_NAME} caracteres o menos.` };
  }

  const members = [];
  for (const member of draft.members) {
    const personName = member.name.trim();
    if (personName === '') {
      if (existingIds.includes(member.id)) {
        return {
          ok: false,
          error: 'Una persona quedó sin nombre. Escribe su nombre; si ya no va, quítala de la lista.',
        };
      }
      continue;
    }
    if (personName.length > MAX_PERSON_NAME) {
      return {
        ok: false,
        error: `El nombre "${personName.slice(0, 15)}…" es muy largo. Usa ${MAX_PERSON_NAME} caracteres o menos.`,
      };
    }
    members.push({ id: member.id, name: personName });
  }

  if (members.length < 2) {
    return {
      ok: false,
      error: 'Un grupo necesita al menos 2 personas. Agrega a alguien más con "Agregar persona".',
    };
  }
  if (members.length > MAX_MEMBERS) {
    return { ok: false, error: `Un grupo puede tener hasta ${MAX_MEMBERS} personas. Quita a alguien para guardar.` };
  }

  const seen = new Set();
  for (const member of members) {
    const key = member.name.toLocaleLowerCase('es');
    if (seen.has(key)) {
      return {
        ok: false,
        error: `"${member.name}" está repetido. Cada persona necesita un nombre distinto, por ejemplo "${member.name} M." y "${member.name} R.".`,
      };
    }
    seen.add(key);
  }

  return {
    ok: true,
    fields: { name, members, memberIds: members.map((m) => m.id) },
  };
}

/** "1 persona" / "4 personas" */
export function peopleLabel(count) {
  return count === 1 ? '1 persona' : `${count} personas`;
}


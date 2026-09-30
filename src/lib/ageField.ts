/** Inclusive ages offered in the Age selector (7 through 100). */
export const AGE_OPTIONS: string[] = Array.from({ length: 94 }, (_, i) => String(i + 7));

export function isAgeField(field: { name?: string; label?: string }): boolean {
  const name = (field.name || '').trim().toLowerCase();
  const label = (field.label || '').trim().toLowerCase();
  return name === 'age' || label === 'age';
}

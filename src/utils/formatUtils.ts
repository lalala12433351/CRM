/**
 * Text & Name Formatting Utilities
 * Standardizes names and labels to clean Title Case, removing accidental ALL-CAPS (capslock)
 * while preserving single-letter initials and standard abbreviations.
 */

export function formatProperName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((word) => {
      // Check if word contains hyphens (e.g. Jean-Luc, Mary-Jane)
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            if (part.length <= 1) return part.toUpperCase();
            if (/^(II|III|IV|VI|VII|VIII|IX|X|CEO|CTO|CFO|COO|VP|MD|HR|AI|CTWA|CAPI)$/i.test(part)) {
              return part.toUpperCase();
            }
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      }

      // Single-letter initial (e.g. "C", "A", "K")
      if (word.length === 1) {
        return word.toUpperCase();
      }

      // Keep standard abbreviations and roman numerals uppercase
      if (/^(II|III|IV|VI|VII|VIII|IX|X|CEO|CTO|CFO|COO|VP|MD|HR|AI|CTWA|CAPI|VIP|CRM)$/i.test(word)) {
        return word.toUpperCase();
      }

      // Standard word: First letter uppercase, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * reminderLinks.ts
 * Utilities for managing reminder links in notes
 */

/**
 * Extract linked reminder IDs from notes
 * Format:
 * Related:
 * ID1, ID2, ID3
 */
export function extractLinks(notes?: string): string[] {
  if (!notes) return [];

  const lines = notes.split('\n');
  let foundRelated = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'Related:') {
      foundRelated = true;
      continue;
    }

    if (foundRelated && trimmed) {
      return trimmed
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }

  return [];
}

/**
 * Format link IDs into Related section
 */
export function formatLinks(ids: string[]): string {
  if (ids.length === 0) return '';
  return `Related:\n${ids.join(', ')}`;
}

/**
 * Check if a reminder ID is linked in notes
 */
export function hasLink(notes: string | undefined, id: string): boolean {
  return extractLinks(notes).includes(id);
}

// Legacy export alias
export { extractLinks as extractReminderIdsFromNotes };

// Legacy type for backwards compatibility
export interface RelatedReminder {
  id: string;
  title: string;
  list?: string;
  relationship:
    | 'dependency'
    | 'follow-up'
    | 'related'
    | 'blocked-by'
    | 'prerequisite';
}

/**
 * @deprecated Use formatLinks instead
 */
export function formatRelatedReminders(related: RelatedReminder[]): string {
  if (related.length === 0) return '';
  const ids = related.map((r) => r.id);
  return `\n\nRelated:\n${ids.join(', ')}`;
}

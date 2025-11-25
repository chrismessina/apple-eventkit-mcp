/**
 * reminderLinks.test.ts
 * Tests for reminder link utilities
 */

import {
  extractLinks,
  formatLinks,
  formatRelatedReminders,
  hasLink,
  type RelatedReminder,
} from './reminderLinks.js';

describe('extractLinks', () => {
  it('should extract single link', () => {
    const notes = 'Related:\nABC123';
    expect(extractLinks(notes)).toEqual(['ABC123']);
  });

  it('should extract multiple links', () => {
    const notes = 'Related:\nABC, DEF, GHI';
    expect(extractLinks(notes)).toEqual(['ABC', 'DEF', 'GHI']);
  });

  it('should extract links from multiline notes', () => {
    const notes = 'Some content\n\nRelated:\nABC, DEF';
    expect(extractLinks(notes)).toEqual(['ABC', 'DEF']);
  });

  it('should return empty array for no links', () => {
    expect(extractLinks('Just content')).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    expect(extractLinks(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(extractLinks('')).toEqual([]);
  });

  it('should handle whitespace in IDs', () => {
    const notes = 'Related:\nABC , DEF ';
    expect(extractLinks(notes)).toEqual(['ABC', 'DEF']);
  });

  it('should handle Related at start of notes', () => {
    const notes = 'Related:\nABC\n\nSome other content';
    expect(extractLinks(notes)).toEqual(['ABC']);
  });
});

describe('formatLinks', () => {
  it('should format single link', () => {
    expect(formatLinks(['ABC'])).toBe('Related:\nABC');
  });

  it('should format multiple links', () => {
    expect(formatLinks(['ABC', 'DEF', 'GHI'])).toBe('Related:\nABC, DEF, GHI');
  });

  it('should return empty string for empty array', () => {
    expect(formatLinks([])).toBe('');
  });
});

describe('hasLink', () => {
  it('should return true if link exists', () => {
    const notes = 'Related:\nABC, DEF';
    expect(hasLink(notes, 'ABC')).toBe(true);
    expect(hasLink(notes, 'DEF')).toBe(true);
  });

  it('should return false if link does not exist', () => {
    const notes = 'Related:\nABC, DEF';
    expect(hasLink(notes, 'GHI')).toBe(false);
  });

  it('should return false for undefined notes', () => {
    expect(hasLink(undefined, 'ABC')).toBe(false);
  });

  it('should return false for notes without links', () => {
    expect(hasLink('Just content', 'ABC')).toBe(false);
  });
});

describe('formatRelatedReminders (legacy)', () => {
  it('should format related reminders as Related line', () => {
    const related: RelatedReminder[] = [
      { id: 'ABC', title: 'Task 1', relationship: 'dependency' },
      { id: 'DEF', title: 'Task 2', relationship: 'follow-up' },
    ];

    const result = formatRelatedReminders(related);
    expect(result).toBe('\n\nRelated:\nABC, DEF');
  });

  it('should return empty string for empty array', () => {
    expect(formatRelatedReminders([])).toBe('');
  });
});

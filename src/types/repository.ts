/**
 * repository.ts
 * Shared type definitions for repository layer JSON interfaces
 */

/**
 * Recurrence rule JSON interface matching EventKitCLI output
 */
export interface RecurrenceRuleJSON {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string | null;
  occurrenceCount?: number | null;
  daysOfWeek?: number[] | null; // 1 = Sunday, 7 = Saturday
  daysOfMonth?: number[] | null; // 1-31
  monthsOfYear?: number[] | null; // 1-12
}

/**
 * JSON interfaces matching the output from EventKitCLI
 */

export interface ReminderJSON {
  id: string;
  title: string;
  isCompleted: boolean;
  list: string;
  notes: string | null;
  url: string | null;
  dueDate: string | null;
  priority: number;
  isFlagged: boolean;
  recurrence: RecurrenceRuleJSON | null;
}

export interface ListJSON {
  id: string;
  title: string;
}

export interface EventJSON {
  id: string;
  title: string;
  calendar: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  location: string | null;
  url: string | null;
  isAllDay: boolean;
}

export interface CalendarJSON {
  id: string;
  title: string;
}

/**
 * Read result interfaces
 */

export interface ReminderReadResult {
  lists: ListJSON[];
  reminders: ReminderJSON[];
}

export interface EventsReadResult {
  calendars: CalendarJSON[];
  events: EventJSON[];
}

/**
 * Data interfaces for repository methods
 */

export interface CreateReminderData {
  title: string;
  list?: string;
  notes?: string;
  url?: string;
  dueDate?: string;
  priority?: number;
  isFlagged?: boolean;
  recurrence?: RecurrenceRuleJSON;
}

export interface UpdateReminderData {
  id: string;
  newTitle?: string;
  list?: string;
  notes?: string;
  url?: string;
  isCompleted?: boolean;
  dueDate?: string;
  priority?: number;
  isFlagged?: boolean;
  recurrence?: RecurrenceRuleJSON;
  clearRecurrence?: boolean;
}

export interface CreateEventData {
  title: string;
  startDate: string;
  endDate: string;
  calendar?: string;
  notes?: string;
  location?: string;
  url?: string;
  isAllDay?: boolean;
}

export interface UpdateEventData {
  id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  calendar?: string;
  notes?: string;
  location?: string;
  url?: string;
  isAllDay?: boolean;
}

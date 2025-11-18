/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  CalendarsToolArgs,
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import { TOOLS } from './definitions.js';
import {
  handleCreateCalendarEvent,
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteCalendarEvent,
  handleDeleteReminder,
  handleDeleteReminderList,
  handleReadCalendarEvents,
  handleReadCalendars,
  handleReadReminderLists,
  handleReadReminders,
  handleUpdateCalendarEvent,
  handleUpdateReminder,
  handleUpdateReminderList,
} from './handlers/index.js';

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
const TOOL_ALIASES: Record<string, string> = {
  'reminders.tasks': 'reminders_tasks',
  'reminders.lists': 'reminders_lists',
  'calendar.events': 'calendar_events',
  'calendar.calendars': 'calendar_calendars',
};

function normalizeToolName(name: string): string {
  return TOOL_ALIASES[name] ?? name;
}

type ToolArgs =
  | RemindersToolArgs
  | ListsToolArgs
  | CalendarToolArgs
  | CalendarsToolArgs;

type ToolRouter = (args?: ToolArgs) => Promise<CallToolResult>;

type ActionHandler<TArgs extends { action: string }> = (
  args: TArgs,
) => Promise<CallToolResult>;

type RoutedToolName = 'reminders_tasks' | 'reminders_lists' | 'calendar_events';
type ToolName = RoutedToolName | 'calendar_calendars';

const createActionRouter = <TArgs extends { action: string }>(
  toolName: RoutedToolName,
  handlerMap: Record<TArgs['action'], ActionHandler<TArgs>>,
): ToolRouter => {
  return async (args?: ToolArgs) => {
    if (!args) {
      return createErrorResponse('No arguments provided');
    }

    const typedArgs = args as TArgs;
    const handler = handlerMap[typedArgs.action];

    if (!handler) {
      return createErrorResponse(
        MESSAGES.ERROR.UNKNOWN_ACTION(toolName, String(typedArgs.action)),
      );
    }

    return handler(typedArgs);
  };
};

const TOOL_ROUTER_MAP = {
  reminders_tasks: createActionRouter<RemindersToolArgs>('reminders_tasks', {
    read: (reminderArgs) => handleReadReminders(reminderArgs),
    create: (reminderArgs) => handleCreateReminder(reminderArgs),
    update: (reminderArgs) => handleUpdateReminder(reminderArgs),
    delete: (reminderArgs) => handleDeleteReminder(reminderArgs),
  }),
  reminders_lists: createActionRouter<ListsToolArgs>('reminders_lists', {
    read: async (_listArgs) => handleReadReminderLists(),
    create: (listArgs) => handleCreateReminderList(listArgs),
    update: (listArgs) => handleUpdateReminderList(listArgs),
    delete: (listArgs) => handleDeleteReminderList(listArgs),
  }),
  calendar_events: createActionRouter<CalendarToolArgs>('calendar_events', {
    read: (calendarArgs) => handleReadCalendarEvents(calendarArgs),
    create: (calendarArgs) => handleCreateCalendarEvent(calendarArgs),
    update: (calendarArgs) => handleUpdateCalendarEvent(calendarArgs),
    delete: (calendarArgs) => handleDeleteCalendarEvent(calendarArgs),
  }),
  calendar_calendars: async (args?: ToolArgs) =>
    handleReadCalendars(args as CalendarsToolArgs | undefined),
} satisfies Record<ToolName, ToolRouter>;

const isManagedToolName = (value: string): value is ToolName =>
  value in TOOL_ROUTER_MAP;

/**
 * Creates an error response with the given message
 */
function createErrorResponse(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export async function handleToolCall(
  name: string,
  args?: ToolArgs,
): Promise<CallToolResult> {
  const normalizedName = normalizeToolName(name);

  if (!isManagedToolName(normalizedName)) {
    return createErrorResponse(MESSAGES.ERROR.UNKNOWN_TOOL(name));
  }

  const router = TOOL_ROUTER_MAP[normalizedName];
  return router(args);
}

export { TOOLS };

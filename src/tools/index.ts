/**
 * @fileoverview Main tool definitions and handler functions
 * @module tools/index
 * @description Routes MCP tool calls to appropriate handlers for reminders, lists, and calendar operations
 * Provides centralized tool call handling with consistent error management
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  CalendarsToolArgs,
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
import { MESSAGES, TOOLS as TOOL_NAMES } from '../utils/constants.js';
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
 * @param {string} name - Name of the tool to call (e.g., 'reminders_tasks', 'calendar_events')
 * @param {ToolArgs} args - Arguments for the tool call
 * @returns {Promise<CallToolResult>} Result of the tool call with formatted output
 * @throws {Error} If tool name is unknown or handler execution fails
 * @description
 * Supports both canonical names ('reminders_tasks') and dot notation ('reminders.tasks')
 * Routes to specific handlers for reminders, lists, and calendar operations
 * @example
 * await handleToolCall('reminders_tasks', { action: 'create', title: 'New task' });
 * await handleToolCall('calendar.events', { action: 'read', search: 'meeting' });
 */
const TOOL_ALIASES: Record<string, string> = TOOL_NAMES.ALIASES;

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

/**
 * Creates an action router for tools with multiple actions
 */
const createActionRouter = <TArgs extends { action: string }>(
  toolName: RoutedToolName,
  handlerMap: Record<TArgs['action'], ActionHandler<TArgs>>,
): ToolRouter => {
  return async (args?: ToolArgs) => {
    if (!args) {
      return createErrorResponse('No arguments provided');
    }

    // Type assertion is necessary here due to union type narrowing limitations
    // The router map ensures type safety at the configuration level
    const typedArgs = args as TArgs;
    const action = typedArgs.action;

    if (!(action in handlerMap)) {
      return createErrorResponse(
        MESSAGES.ERROR.UNKNOWN_ACTION(toolName, String(action)),
      );
    }

    const handler = handlerMap[action as keyof typeof handlerMap];
    return handler(typedArgs);
  };
};

const TOOL_ROUTER_MAP = {
  [TOOL_NAMES.REMINDERS_TASKS]: createActionRouter<RemindersToolArgs>(
    TOOL_NAMES.REMINDERS_TASKS,
    {
      read: (reminderArgs) => handleReadReminders(reminderArgs),
      create: (reminderArgs) => handleCreateReminder(reminderArgs),
      update: (reminderArgs) => handleUpdateReminder(reminderArgs),
      delete: (reminderArgs) => handleDeleteReminder(reminderArgs),
    },
  ),
  [TOOL_NAMES.REMINDERS_LISTS]: createActionRouter<ListsToolArgs>(
    TOOL_NAMES.REMINDERS_LISTS,
    {
      read: async (_listArgs) => handleReadReminderLists(),
      create: (listArgs) => handleCreateReminderList(listArgs),
      update: (listArgs) => handleUpdateReminderList(listArgs),
      delete: (listArgs) => handleDeleteReminderList(listArgs),
    },
  ),
  [TOOL_NAMES.CALENDAR_EVENTS]: createActionRouter<CalendarToolArgs>(
    TOOL_NAMES.CALENDAR_EVENTS,
    {
      read: (calendarArgs) => handleReadCalendarEvents(calendarArgs),
      create: (calendarArgs) => handleCreateCalendarEvent(calendarArgs),
      update: (calendarArgs) => handleUpdateCalendarEvent(calendarArgs),
      delete: (calendarArgs) => handleDeleteCalendarEvent(calendarArgs),
    },
  ),
  [TOOL_NAMES.CALENDAR_CALENDARS]: async (args?: ToolArgs) =>
    handleReadCalendars(args),
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

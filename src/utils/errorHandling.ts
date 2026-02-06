/**
 * errorHandling.ts
 * Centralized error handling utilities for consistent error responses
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ValidationError } from '../validation/schemas.js';

/**
 * Custom error class for user-facing CLI failures (e.g., not found, invalid input).
 * Defined here to avoid circular/heavy imports from cliExecutor.
 */
export class CliUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUserError';
  }
}

/**
 * Creates a descriptive error message, showing validation details in dev mode.
 */
function createErrorMessage(operation: string, error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'System error occurred';
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG;

  // For validation and CLI user errors, always return the detailed message.
  if (error instanceof ValidationError || error instanceof CliUserError) {
    return message;
  }

  // For other errors, be generic in production.
  return isDev
    ? `Failed to ${operation}: ${message}`
    : `Failed to ${operation}: System error occurred`;
}

/**
 * Utility for handling async operations with consistent error handling
 */
export async function handleAsyncOperation(
  operation: () => Promise<string>,
  operationName: string,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return {
      content: [{ type: 'text', text: result }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: createErrorMessage(operationName, error),
        },
      ],
      isError: true,
    };
  }
}

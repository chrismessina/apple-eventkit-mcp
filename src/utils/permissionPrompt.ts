/**
 * @fileoverview AppleScript-based permission prompting for EventKit access
 * @module utils/permissionPrompt
 * @description Triggers macOS permission dialogs via AppleScript when EventKit
 * permissions are not yet granted. This is essential for non-interactive contexts
 * where the Swift binary's permission request may not surface the system dialog.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Permission domains supported by the system
 */
export type PermissionDomain = 'reminders' | 'calendars';

/**
 * AppleScript snippets that trigger permission dialogs for each domain
 */
const APPLESCRIPT_SNIPPETS: Record<PermissionDomain, string> = {
  reminders: 'tell application "Reminders" to get the name of every list',
  calendars: 'tell application "Calendar" to get the name of every calendar',
};

/**
 * Cache for tracking which domains have already been prompted
 * to avoid duplicate permission dialogs in the same session
 */
const promptedDomains = new Set<PermissionDomain>();

/**
 * Triggers the macOS permission dialog for the specified domain
 * @param domain - The permission domain to request ('reminders' or 'calendars')
 * @returns Promise that resolves when the permission prompt has been triggered
 * @description
 * - Uses AppleScript to interact with Reminders/Calendar apps
 * - This triggers macOS to show the permission dialog if not yet granted
 * - Caches results to avoid duplicate prompts in the same session
 * @example
 * await triggerPermissionPrompt('reminders');
 */
export async function triggerPermissionPrompt(
  domain: PermissionDomain,
): Promise<void> {
  // Skip if already prompted in this session
  if (promptedDomains.has(domain)) {
    return;
  }

  const script = APPLESCRIPT_SNIPPETS[domain];

  try {
    await execFileAsync('osascript', ['-e', script]);
    promptedDomains.add(domain);
  } catch {
    // Even if the script fails (e.g., permission denied),
    // mark as prompted to avoid repeated attempts
    promptedDomains.add(domain);
  }
}

/**
 * Checks if a domain has already been prompted in this session
 * @param domain - The permission domain to check
 * @returns Whether the domain has already been prompted
 */
export function hasBeenPrompted(domain: PermissionDomain): boolean {
  return promptedDomains.has(domain);
}

/**
 * Resets the prompted domains cache (mainly for testing)
 */
export function resetPromptedDomains(): void {
  promptedDomains.clear();
}

/**
 * applescriptList.ts
 * AppleScript utility functions for reminder list emblem operations
 */

import { runAppleScript } from './cliExecutor.js';

/**
 * Gets the emblem (icon) for a reminder list
 * @param listTitle - The title of the reminder list
 * @returns The emblem emoji or undefined if not found
 */
export async function getListEmblem(
  listTitle: string,
): Promise<string | undefined> {
  const script = `
    tell application "Reminders"
      try
        set theList to list "${listTitle}"
        if emblem of theList is not missing value then
          return emblem of theList
        else
          return ""
        end if
      on error
        return ""
      end try
    end tell
  `;

  try {
    const result = await runAppleScript(script);
    return result.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sets the emblem (icon) for a reminder list
 * @param listTitle - The title of the reminder list
 * @param emblem - The emoji to set as the emblem
 */
export async function setListEmblem(
  listTitle: string,
  emblem: string,
): Promise<void> {
  const script = `
    tell application "Reminders"
      try
        set theList to list "${listTitle}"
        set emblem of theList to "${emblem}"
      on error errorMessage
        error errorMessage
      end try
    end tell
  `;

  await runAppleScript(script);
}

/**
 * Parses a list display string to extract emblem
 * @param display - The display string (e.g., "🛒 Courses [#007AFF]")
 * @returns The emblem emoji or undefined
 */
export function parseEmblem(display: string): string | undefined {
  const emojiRegex = /^([\p{Emoji}\p{Emoji_Presentation}])/u;
  const match = display.match(emojiRegex);
  return match ? match[1] : undefined;
}

/**
 * Formats a list display string with emoji and color
 * @param title - The list title
 * @param emblem - The emblem emoji (optional)
 * @param color - The color hex code (optional)
 * @returns Formatted display string
 */
export function formatListDisplay(
  title: string,
  emblem?: string,
  color?: string,
): string {
  let display = '';
  if (emblem) display += `${emblem} `;
  display += title;
  if (color) display += ` [${color}]`;
  return display;
}

/**
 * Gets emblems for multiple lists in parallel
 * @param listTitles - Array of list titles
 * @returns Map of list titles to their emblems
 */
export async function getListEmblems(
  listTitles: string[],
): Promise<Map<string, string | undefined>> {
  const emblemMap = new Map<string, string | undefined>();

  await Promise.all(
    listTitles.map(async (title) => {
      const emblem = await getListEmblem(title);
      emblemMap.set(title, emblem);
    }),
  );

  return emblemMap;
}
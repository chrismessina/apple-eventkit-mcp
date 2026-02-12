/**
 * applescriptList.ts
 * AppleScript utility functions for reminder list emblem operations
 */

import { escapeAppleScriptString, runAppleScript } from './cliExecutor.js';

/**
 * Gets the emblem (icon) for a reminder list
 * @param listTitle - The title of the reminder list
 * @returns The emblem emoji or undefined if not found
 */
export async function getListEmblem(
  listTitle: string,
): Promise<string | undefined> {
  const escapedTitle = escapeAppleScriptString(listTitle);
  const script = `
    tell application "Reminders"
      try
        set theList to list "${escapedTitle}"
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
  const escapedTitle = escapeAppleScriptString(listTitle);
  const escapedEmblem = escapeAppleScriptString(emblem);
  const script = `
    tell application "Reminders"
      try
        set theList to list "${escapedTitle}"
        set emblem of theList to "${escapedEmblem}"
      on error errorMessage
        error errorMessage
      end try
    end tell
  `;

  await runAppleScript(script);
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
  // Try batch lookup first - get all emblems in a single AppleScript call
  try {
    const script = `
      tell application "Reminders"
        set allLists to every list
        set resultText to ""
        set tabChar to (ASCII character 9)
        set newlineChar to (ASCII character 10)
        repeat with i from 1 to count of allLists
          set currentList to item i of allLists
          set listName to name of currentList
          set listEmblem to emblem of currentList
          if listEmblem is missing value then
            set listEmblem to ""
          end if
          if i is 1 then
            set resultText to listName & tabChar & listEmblem
          else
            set resultText to resultText & newlineChar & listName & tabChar & listEmblem
          end if
        end repeat
        return resultText
      end tell
    `;

    const result = await runAppleScript(script);
    const lines = result.trim().split('\n');
    const emblemMap = new Map<string, string | undefined>();

    for (const line of lines) {
      const [name, emblem] = line.split('\t');
      if (listTitles.includes(name)) {
        emblemMap.set(name, emblem || undefined);
      }
    }

    // Fallback to per-list lookup for any titles not found in batch result
    for (const title of listTitles) {
      if (!emblemMap.has(title)) {
        const emblem = await getListEmblem(title);
        emblemMap.set(title, emblem);
      }
    }

    return emblemMap;
  } catch {
    // Fallback to per-list lookup on error
    const emblemMap = new Map<string, string | undefined>();

    await Promise.all(
      listTitles.map(async (title) => {
        const emblem = await getListEmblem(title);
        emblemMap.set(title, emblem);
      }),
    );

    return emblemMap;
  }
}

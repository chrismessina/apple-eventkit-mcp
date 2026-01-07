# Apple Events MCP Server

## Project Overview
This project is a Model Context Protocol (MCP) server that provides native integration with Apple Reminders and Apple Calendar on macOS. It allows AI agents to read, create, update, and delete reminders and calendar events, manage lists, and organize tasks using natural language.

**Key Technologies:**
*   **Runtime:** Node.js (TypeScript)
*   **Native Integration:** Swift (EventKit)
*   **Protocol:** Model Context Protocol (MCP) SDK
*   **Validation:** Zod
*   **Testing:** Jest
*   **Linting/Formatting:** Biome

## Architecture
The project follows a 4-layer Clean Architecture:
1.  **Server Layer** (`src/server/`): Handles MCP protocol communication and request routing.
2.  **Handlers Layer** (`src/tools/handlers/`): Business logic for specific tools (reminders, calendars).
3.  **Utils/Repository Layer** (`src/utils/`): Helper functions, validation, and data access patterns.
4.  **Native Bridge** (`src/swift/`): A Swift binary (`EventKitCLI`) that directly interacts with the macOS EventKit API. This is crucial for handling permissions and accessing system data reliably.

## Building and Running

### Prerequisites
*   Node.js 18+
*   macOS (for EventKit integration)
*   Xcode Command Line Tools (for Swift compilation)
*   pnpm

### Commands
*   **Install Dependencies:** `pnpm install`
*   **Build (TS & Swift):** `pnpm build` (Required before starting)
*   **Build Swift Only:** `pnpm build:swift`
*   **Start Server:** `pnpm start` (Runs via stdio)
*   **Development Mode:** `pnpm dev`
*   **Run Tests:** `pnpm test`
*   **Lint & Format:** `pnpm lint` (Uses Biome)

## Available Tools
The server exposes 4 main tools:

1.  **`reminders_tasks`**: CRUD operations for individual reminders (create, read, update, delete). Supports filtering by list, due date, etc.
2.  **`reminders_lists`**: Manage reminder lists (create, read, update, delete).
3.  **`calendar_events`**: CRUD operations for calendar events. Supports time blocking and scheduling.
4.  **`calendar_calendars`**: Read-only access to available calendars.

## Development Guidelines

### Coding Style
*   **Language:** TypeScript (NodeNext) & Swift.
*   **Formatting:** Strictly follow Biome configuration (`biome.json`). Single quotes, space indentation.
*   **Imports:** Organize imports.

### Testing
*   **Framework:** Jest.
*   **Scope:** Unit tests for TypeScript logic, integration tests for the Swift bridge (mocked or actual).
*   **Command:** `pnpm test`

### Contribution
*   **Commits:** Follow Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
*   **Workflow:** Ensure `pnpm build` and `pnpm test` pass before committing.

## Key Files
*   `src/index.ts`: Entry point.
*   `src/server/server.ts`: Server configuration.
*   `src/swift/EventKitCLI.swift`: Native Swift bridge implementation.
*   `src/tools/definitions.ts`: MCP tool schema definitions.
*   `package.json`: Project configuration and scripts.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension project built with Svelte 5, TypeScript, and Vite using the CRXJS plugin. The project serves as a template for developing Chrome extensions with modern web technologies. It includes popup, content script, and side panel functionality.

## Architecture

### Directory Structure

- `src/popup/` - Extension popup UI components
- `src/content/` - Content script functionality that runs on web pages
- `src/sidepanel/` - Side panel interface components
- `src/components/` - Reusable Svelte components
- `manifest.config.ts` - Chrome Extension Manifest V3 configuration
- `vite.config.ts` - Vite build configuration with CRXJS plugin

### Key Components

1. **Manifest Configuration** (`manifest.config.ts`): Defines the Chrome Extension Manifest V3 with icons, action popup, content scripts, and permissions
2. **Content Script** (`src/content/main.ts`): Injects a Svelte app into web pages and runs on all HTTPS pages
3. **Popup UI** (`src/popup/`): The extension's popup interface when clicking the extension icon
4. **Side Panel** (`src/sidepanel/`): Provides a side panel interface for the extension
5. **Socket.io Client** (`src/content/socket-client.ts`): Establishes real-time communication with proxy server at `http://localhost:4001`, handles connection management and message passing
6. **Fetch Interceptor** (`src/content/fetch-injector.ts`): Intercepts fetch API calls and forwards requests/responses to the socket.io server for monitoring and proxying

### Technologies

- Svelte 5 (frontend framework)
- TypeScript (type-safe JavaScript)
- Vite (build tool and development server)
- CRXJS (Chrome extension development plugin for Vite)
- PNPM (package manager)
- Socket.io (real-time communication with proxy server)

## Development Commands

### Setup

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

This starts the development server with hot reloading for Chrome extension development.

### Build

```bash
pnpm run build
```

This creates a production build of the extension.

### Loading the Extension in Chrome

1. Run `pnpm run dev` to build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` directory

## Chrome Extension Development Notes

- Use `manifest.config.ts` to configure your extension's manifest settings
- Content scripts should be placed in `src/content/` and will run on all HTTPS pages by default
- Popup UI should be placed in `src/popup/`
- Side panel UI should be placed in `src/sidepanel/`
- The project includes a zip-pack plugin that creates release packages in the `release` directory
- Socket.io client connects to `http://localhost:4001` by default - make sure your proxy server is running on this endpoint
- Fetch interceptor captures all fetch API calls and sends them to the socket.io server with types: "fetch_request", "fetch_response", or "fetch_error"

### Code Style Guidelines

- **Syntax:** Use ES Modules (`import`/`export`) rather than CommonJS. Use modern ES6+ features (arrow functions, etc.) where appropriate.
- **Formatting:** Use 2 spaces for indentation. Use single quotes for strings. **No** trailing semicolons _(we run Prettier)_ – except where necessary in TypeScript _(enums, interfaces)_.
- **Naming:** Use `camelCase` for variables/functions, `PascalCase` for React components and classes. Constants in `UPPER_SNAKE_CASE`.
- **Patterns:** Prefer functional components with hooks over class components in React. Avoid using any deprecated APIs.

## Error Handling & Debugging

- **Diagnose, Don't Guess:** When encountering a bug or failing test, first explain possible causes step-by-step: [docs.claude.com](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought%23:~:text=,where%20prompts%20may%20be%20unclear). Check assumptions, inputs, and relevant code paths.
- **Graceful Handling:** Code should handle errors gracefully. For example, use try/catch around async calls, and return user-friendly error messages or fallback values when appropriate.
- **Logging:** Include helpful console logs or error logs for critical failures (but avoid log spam in production code).
- **No Silent Failures:** Do not swallow exceptions silently. Always surface errors either by throwing or logging them.

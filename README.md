# Svelte + Vite + CRXJS

This template helps you quickly start developing Chrome extensions with Svelte, TypeScript and Vite. It includes the CRXJS Vite plugin for seamless Chrome extension development.

## Features

- Svelte with component syntax
- TypeScript support
- Vite build tool
- CRXJS Vite plugin integration
- Chrome extension manifest configuration
- Socket.io client for real-time communication with proxy server
- Fetch API interception for monitoring and proxying requests

## Socket.io Client Integration

The extension includes a socket.io client that enables real-time communication with a proxy server. Key features include:

- Automatic connection to `http://localhost:4001` when the extension loads
- Fetch API interception that forwards requests and responses to the socket.io server
- Error handling and automatic reconnection capabilities
- Message queuing when the socket is not connected

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start development server:

```bash
pnpm run dev
```

3. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

4. Build for production:

```bash
pnpm run build
```

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.ts` - Chrome extension manifest configuration

## Chrome Extension Development Notes

- Use `manifest.config.ts` to configure your extension
- The CRXJS plugin automatically handles manifest generation
- Content scripts should be placed in `src/content/`
- Popup UI should be placed in `src/popup/`

## Documentation

- [Svelte Documentation](https://svelte.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Documentation](https://crxjs.dev/vite-plugin)

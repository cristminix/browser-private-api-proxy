import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json"

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_popup: "src/popup/index.html",
  },
  content_scripts: [
    {
      js: ["src/content/main.ts"],
      matches: ["https://chat.deepseek.com/*", "https://chat.z.ai/*"],
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/content/dist/fetch-injector.js"],
      matches: ["https://chat.deepseek.com/*", "https://chat.z.ai/*"],
    },
  ],
  permissions: ["sidePanel", "contentSettings"],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' ws://localhost:4001 http://localhost:4001;",
  },
})

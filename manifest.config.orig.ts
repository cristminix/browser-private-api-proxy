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
      matches: ["https://learning.oreilly.com/*", "https://www.oreilly.com/*", "https://chat.z.ai/*", "https://chat.mistral.ai/*", "https://chat.deepseek.com/*"],
    },
  ],
  web_accessible_resources: [
    {
      resources: ["src/content/dist/fetch-injector.js"],
      matches: ["https://learning.oreilly.com/*", "https://www.oreilly.com/*", "https://chat.z.ai/*", "https://chat.mistral.ai/*", "https://chat.deepseek.com/*"],
    },
  ],
  permissions: ["sidePanel", "contentSettings"],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
})

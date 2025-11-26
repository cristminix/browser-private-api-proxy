/// <reference types="svelte" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_CLENT: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_EXT_TARGET_BROWSER: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

import { injectScriptSync } from "../global/fn/injectScriptSync"
import ContentScriptProxy from "./ContentScriptProxy"
import { injectLinkSync } from "../global/fn/injectLinkSync"

const main = async () => {
  const contentScript = new ContentScriptProxy()
  /*INJECT_START*/
  await injectScriptSync("src/content-scripts/inject/dist/inject.js")
  await injectLinkSync("stylesheet", "src/content-scripts/inject/dist/inject.css")
  /*INJECT_END*/
}

main()

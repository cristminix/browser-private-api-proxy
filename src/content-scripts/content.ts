import { injectScriptSync } from "@/global/fn/injectScriptSync"
import ContentScriptProxy from "./ContentScriptProxy"
import { injectLinkSync } from "@/global/fn/injectLinkSync"

const main = async () => {
  const contentScript = new ContentScriptProxy()
  /*INJECT_START*/
  await injectScriptSync("content-script-inject.js")
  await injectLinkSync("stylesheet", "style.css")
  /*INJECT_END*/
}

main()

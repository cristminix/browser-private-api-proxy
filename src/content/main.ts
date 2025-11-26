// Create and inject the fetch interceptor using web accessible resources
try {
  // Create a script element that references the web accessible resource
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("src/content/dist/fetch-injector.js")

  // Add to the page
  ;(document.head || document.documentElement).appendChild(script)

  // console.log("[CRXJS] Fetch interceptor injected into page DOM via web accessible resource")
} catch (error) {
  // console.error("[CRXJS] Error injecting fetch-interceptor script:", error)
}
// Simple fetch and XHR interceptor without DOM dependencies
import { ProxyBridge } from "../global/classes/ProxyBridge"
// import { interceptFetchCall } from "./fn/interceptFetchCall"
// import { interceptXHRCall } from "./fn/interceptXHRCall"

const bridge = new ProxyBridge()

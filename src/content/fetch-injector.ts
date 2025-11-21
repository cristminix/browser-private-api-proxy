import { ProxyBridge } from "../global/classes/ProxyBridge"
import { interceptFetchCall } from "./fn/interceptFetchCall"
import jquery from "jquery"
const bridge = new ProxyBridge()

window.jquery = jquery
// This code runs in the page context, not the content script context
if (!(window as any).fetchInterceptorInjected) {
  // console.log("[CRXJS] Fetch interceptor injected into page DOM")
  if (document.location.hostname.includes("z.ai")) {
    interceptFetchCall(bridge)
    ;(window as any).fetchInterceptorInjected = true
    // console.log("[CRXJS] Fetch interception enabled via DOM injection")
  }
}

// Ensure Trusted Types policy is set up to prevent TrustedHTML errors
if ((window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  try {
    // Check if a policy with this name already exists
    if (!(window as any).trustedTypes.getPolicy("default")) {
      ;(window as any).trustedTypes.createPolicy("default", {
        createHTML: (string: string) => string,
        createScript: (string: string) => string,
        createScriptURL: (string: string) => string,
      })
    }
  } catch (e) {
    // Policy might already exist, which is fine
  }
}

// Simple fetch and XHR interceptor without DOM dependencies
// import { ProxyBridge } from "../global/classes/ProxyBridge"
import { interceptFetchCall } from "./fn/interceptFetchCall"
import { interceptXHRCall } from "./fn/interceptXHRCall"

const bridge: any = {} //new ProxyBridge()

// Immediately execute when script is loaded (no DOM dependencies)
if (!(window as any).fetchInterceptorInjected) {
  // console.log("[CRXJS] Fetch interceptor injected into page DOM")
  // if (document.location.hostname.includes("z.ai")) {
  interceptFetchCall(bridge)
  interceptXHRCall(bridge)
  ;(window as any).fetchInterceptorInjected = true
  // console.log("[CRXJS] Fetch interception enabled via DOM injection")
  // }
}

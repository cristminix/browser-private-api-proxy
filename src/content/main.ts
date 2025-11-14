import { mount } from "svelte";
import App from "./views/App.svelte";

console.log("[CRXJS] Hello world from content script!");

/**
 * Inject a script into the page's DOM to allow access to the page's JavaScript context.
 */
function injectScript(src: string) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL(src);
  script.onload = () => {
    // Clean up the script element after execution
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

/**
 * Alternative method: Inject script content directly into the DOM
 */
function injectScriptContent(code: string) {
  const script = document.createElement("script");
  script.textContent = code;

  // Add to the page
  (document.head || document.documentElement).appendChild(script);

  // Remove the script element after execution to clean up
  script.remove();
}

/**
 * Mount the Svelte app to the DOM.
 */
function mountApp() {
  const container = document.createElement("div");
  container.id = "crxjs-app";
  document.body.appendChild(container);
  mount(App, {
    target: container,
  });
}

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    fetchInterceptorInjected?: boolean;
  }
}

// Define custom properties for XMLHttpRequest
interface XMLHttpRequest {
  _requestInfo?: {
    method: string;
    url: string | URL;
    async: boolean;
    user?: string | null;
    password?: string | null;
  };
  onload?: (this: XMLHttpRequest, ev: Event) => any;
  onerror?: (this: XMLHttpRequest, ev: Event) => any;
}

// Create and inject the fetch interceptor using web accessible resources
try {
  // Create a script element that references the web accessible resource
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("src/content/fetch-injector.js");

  // Add to the page
  (document.head || document.documentElement).appendChild(script);

  // Remove the script element after execution to clean up
  script.onload = () => {
    script.remove();
  };

  console.log(
    "[CRXJS] Fetch interceptor injected into page DOM via web accessible resource"
  );
} catch (error) {
  console.error("[CRXJS] Error injecting fetch-interceptor script:", error);

  // Fallback: inject a simpler version directly
  try {
    const fallbackScript = document.createElement("script");
    fallbackScript.textContent = `
      if (!window.fetchInterceptorInjected) {
        console.log('[CRXJS] Fetch interceptor injected via fallback');
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          console.log('[CRXJS] Fetch intercepted:', args[0]);
          return originalFetch.apply(this, args);
        };
        window.fetchInterceptorInjected = true;
      }
    `;

    (document.head || document.documentElement).appendChild(fallbackScript);
    fallbackScript.remove();
  } catch (fallbackError) {
    console.error("[CRXJS] Fallback injection also failed:", fallbackError);
  }
}

// Mount the Svelte app as well
mountApp();

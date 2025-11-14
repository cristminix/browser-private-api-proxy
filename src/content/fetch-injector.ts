/**
 * Fetch Interceptor Script for DOM Injection
 * This script will be injected into the webpage's DOM to intercept fetch calls
 * with full access to the page's JavaScript context.
 */

// Import socket.io-client
// Note: Since this script is injected into the DOM, we need to access io from window
declare global {
  interface Window {
    io?: any;
    fetchInterceptorInjected?: boolean;
  }
}
import { socket, sendToSocket } from "./socket-client";
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

//
// This code runs in the page context, not the content script context
if (!(window as any).fetchInterceptorInjected) {
  console.log("[CRXJS] Fetch interceptor injected into page DOM");

  // Store the original fetch function
  const originalFetch = window.fetch;

  // Override the global fetch function
  window.fetch = async function (...args: [any, any]) {
    const [resource, init] = args;

    // Log the original request
    console.log("[CRXJS] Intercepted fetch request:", {
      url:
        typeof resource === "string"
          ? resource
          : (resource as any).url || resource,
      method: init?.method || "GET",
      headers: init?.headers,
      body: init?.body,
    });

    try {
      // Prepare request data to send to socket.io server
      const requestData = {
        type: "fetch_request",
        timestamp: Date.now(),
        url:
          typeof resource === "string"
            ? resource
            : (resource as any).url || resource,
        method: init?.method || "GET",
        headers: init?.headers,
        body: init?.body,
      };

      // Send request data to socket.io server
      sendToSocket(requestData);

      // You can modify the request here before sending
      const modifiedResource = resource; // Modify as needed
      const modifiedInit = { ...init }; // Create a copy to modify

      // Example: Add custom headers for private API proxying
      if (modifiedInit.headers) {
        modifiedInit.headers = {
          ...modifiedInit.headers,
          "X-Private-API-Proxy": "browser-extension",
        };
      } else {
        modifiedInit.headers = { "X-Private-API-Proxy": "browser-extension" };
      }

      // Call the original fetch with potentially modified parameters
      const response = await originalFetch.call(
        this,
        modifiedResource,
        modifiedInit
      );

      // Clone the response to allow reading its body multiple times
      const responseClone = response.clone();

      try {
        const responseBody = await responseClone.text();
        console.log("[CRXJS] Fetch response:", {
          url:
            typeof resource === "string"
              ? resource
              : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        });

        // Send response data to socket.io server
        const responseData = {
          type: "fetch_response",
          timestamp: Date.now(),
          url:
            typeof resource === "string"
              ? resource
              : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        };
        sendToSocket(responseData);
      } catch (e) {
        // Response might be a stream that can't be cloned, log basic info
        console.log("[CRXJS] Fetch response (stream):", {
          url:
            typeof resource === "string"
              ? resource
              : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        // Send response data to socket.io server without body
        const responseData = {
          type: "fetch_response",
          timestamp: Date.now(),
          url:
            typeof resource === "string"
              ? resource
              : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
        sendToSocket(responseData);
      }

      // You can modify the response before returning it
      // For now, return the original response
      return response;
    } catch (error) {
      console.error("[CRXJS] Fetch error:", error);

      // Send error to socket.io server
      const errorData = {
        type: "fetch_error",
        timestamp: Date.now(),
        url:
          typeof resource === "string"
            ? resource
            : (resource as any).url || resource,
        error: error instanceof Error ? error.message : String(error),
      };
      sendToSocket(errorData);

      throw error; // Re-throw the error to maintain original behavior
    }
  };

  // Also intercept XMLHttpRequest for completeness
  const originalXHR = window.XMLHttpRequest;
  const originalOpen = originalXHR.prototype.open;
  const originalSend = originalXHR.prototype.send;

  // Override XMLHttpRequest open method
  (window.XMLHttpRequest.prototype as any).open = function (
    this: XMLHttpRequest,
    method: string,
    url: string,
    async: boolean = true,
    user?: string | null,
    password?: string | null
  ) {
    // Store request info for later use in send
    this._requestInfo = { method, url, async, user, password };
    return originalOpen.apply(this, arguments as any);
  };

  // Override XMLHttpRequest send method
  (window.XMLHttpRequest.prototype as any).send = function (
    this: XMLHttpRequest,
    body?: any
  ) {
    const requestInfo = this._requestInfo;
    console.log("[CRXJS] Intercepted XMLHttpRequest:", {
      method: requestInfo?.method,
      url: requestInfo?.url,
      body: body,
    });

    // Prepare request data to send to socket.io server
    const requestData = {
      type: "xhr_request",
      timestamp: Date.now(),
      method: requestInfo?.method,
      url: requestInfo?.url,
      body: body,
    };

    // Send request data to socket.io server
    sendToSocket(requestData);

    // Store original event handlers to call them after our processing
    const originalOnLoad = this.onload;
    const originalOnError = this.onerror;

    // Set up response handlers
    this.onload = function (this: XMLHttpRequest, ev: Event) {
      console.log("[CRXJS] XMLHttpRequest response:", {
        status: (this as any).status,
        statusText: (this as any).statusText,
        response: (this as any).response,
      });

      // Send response data to socket.io server
      const responseData = {
        type: "xhr_response",
        timestamp: Date.now(),
        method: requestInfo?.method,
        url: requestInfo?.url,
        status: (this as any).status,
        statusText: (this as any).statusText,
        response: (this as any).response,
      };
      sendToSocket(responseData);

      // Call original onload if it exists
      if (originalOnLoad) {
        originalOnLoad.call(this, ev);
      }
    };

    this.onerror = function (this: XMLHttpRequest, ev: Event) {
      console.error("[CRXJS] XMLHttpRequest error:", {
        method: requestInfo?.method,
        url: requestInfo?.url,
      });

      // Send error data to socket.io server
      const errorData = {
        type: "xhr_error",
        timestamp: Date.now(),
        method: requestInfo?.method,
        url: requestInfo?.url,
        error: "XMLHttpRequest error",
      };
      sendToSocket(errorData);

      // Call original onerror if it exists
      if (originalOnError) {
        originalOnError.call(this, ev);
      }
    };

    return originalSend.apply(this, arguments as any);
  };

  // Mark as injected to prevent duplicate injection
  (window as any).fetchInterceptorInjected = true;

  console.log(
    "[CRXJS] Fetch and XMLHttpRequest interception enabled via DOM injection"
  );
}

// Remove export since this is a script file

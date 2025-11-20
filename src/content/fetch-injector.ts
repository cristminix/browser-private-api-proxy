/**
 * Fetch Interceptor Script for DOM Injection
 * This script will be injected into the webpage's DOM to intercept fetch calls
 * with full access to the page's JavaScript context.
 */

// Import socket.io-client
// Note: Since this script is injected into the DOM, we need to access io from window
declare global {
  interface Window {
    io?: any
    fetchInterceptorInjected?: boolean
    jquery?: any
  }
}
import { delay } from "../utils"
import { bridge } from "./socket-client"
import jquery from "jquery"
import * as idb from "idb-keyval"

window.jquery = jquery
// This code runs in the page context, not the content script context
if (!(window as any).fetchInterceptorInjected) {
  console.log("[CRXJS] Fetch interceptor injected into page DOM")

  // Store the original fetch function
  const originalFetch = window.fetch

  // Override the global fetch function
  //@ts-ignore
  window.fetch = async function (...args: [any, any]) {
    const [resource, init] = args
    const { watcher } = bridge
    const options = {
      url: typeof resource === "string" ? resource : (resource as any).url || resource,
      method: init?.method || "GET",
      headers: init?.headers,
      body: init?.body,
    }

    try {
      // Prepare request data to send to socket.io server
      const requestData = {
        type: "fetch_request",
        timestamp: Date.now(),
        ...options,
      }
      const triggeredFromX = await idb.get("x-trigger-web-ext")
      if (triggeredFromX) {
        await idb.set("x-trigger-web-ext", false)
      } else {
        return originalFetch.call(this, resource, options)
      }

      // Send request data to socket.io server
      // bridge.sendMessage(requestData)
      if (watcher) {
        if (resource.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("REQUEST", requestData)
        }
        await delay(257)
      }

      if (watcher) {
        if (resource.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("HEADERS", options.headers)
          // console.log(`Received url: ${resource}`)
          // return
          await delay(257)
        }
      }
      if (watcher) {
        if (resource.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("FETCH", options)
          await delay(257)

          // return createFakeFetchResponse(resource)
          return await originalFetch.call(this, "http://localhost:4001/api/fake-stream-chat")
        }
      }
      // Call the original fetch with potentially modified parameters

      const response = await originalFetch.call(this, resource, options)
      if (watcher) {
        if (resource.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("RESPONSE", null)
          await delay(257)
        }
      }
      // Clone the response to allow reading its body multiple times
      const responseClone = response.clone()

      try {
        const responseBody = await responseClone.text()
        console.log("[CRXJS] Fetch response:", {
          url: typeof resource === "string" ? resource : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        })

        // Send response data to socket.io server
        const responseData = {
          type: "fetch_response",
          timestamp: Date.now(),
          url: typeof resource === "string" ? resource : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        }
        // bridge.sendMessage(responseData)
        if (watcher) {
          if (resource.includes(watcher.matchSourceUrl)) {
            watcher.setPhase("DATA", responseData)
          }
        }
      } catch (e) {
        // Response might be a stream that can't be cloned, log basic info
        console.log("[CRXJS] Fetch response (stream):", {
          url: typeof resource === "string" ? resource : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        })

        // Send response data to socket.io server without body
        const responseData = {
          type: "fetch_response",
          timestamp: Date.now(),
          url: typeof resource === "string" ? resource : (resource as any).url || resource,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        }
        // bridge.sendMessage(responseData)
        if (watcher) {
          if (resource.includes(watcher.matchSourceUrl)) {
            watcher.setPhase("DATA", responseData)
          }
        }
      }

      // You can modify the response before returning it
      // For now, return the original response
      return response
    } catch (error) {
      console.error("[CRXJS] Fetch error:", error)

      // Send error to socket.io server
      const errorData = {
        type: "fetch_error",
        timestamp: Date.now(),
        url: typeof resource === "string" ? resource : (resource as any).url || resource,
        error: error instanceof Error ? error.message : String(error),
      }
      // bridge.sendMessage(errorData)
      if (watcher) {
        if (resource.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("ERROR", errorData)
        }
      }

      throw error // Re-throw the error to maintain original behavior
    }
  }

  // Mark as injected to prevent duplicate injection
  ;(window as any).fetchInterceptorInjected = true

  console.log("[CRXJS] Fetch interception enabled via DOM injection")
}

// Remove export since this is a script file

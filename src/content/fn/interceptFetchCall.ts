import type { ProxyBridge } from "@/global/classes/ProxyBridge"
import { Mutex } from "../../global/classes/Mutex"
import { delay } from "../../utils"
import * as idb from "idb-keyval"
import { streamToResponse } from "./streamToResponse"
// Buat instance mutex global untuk melindungi akses ke "x-trigger-web-ext"
const triggerMutex = new Mutex()

export async function interceptFetchCall(bridge: ProxyBridge) {
  // Store the original fetch function
  const originalFetch = window.fetch

  // Override the global fetch function
  //@ts-ignore
  window.fetch = async function (...args: [any, any]) {
    const [url, init] = args
    const { watcher } = bridge
    const options = {
      url: typeof url === "string" ? url : (url as any).url || url,
      method: init?.method || "GET",
      headers: init?.headers,
      body: init?.body,
    }
    // console.log(watcher)
    // if (!watcher) {
    //   return originalFetch.call(this, url, options)
    // }
    try {
      // Prepare request data to send to socket.io server
      const requestData = {
        type: "fetch_request",
        timestamp: Date.now(),
        ...options,
      }

      // Send request data to socket.io server
      // bridge.sendMessage(requestData)
      if (watcher) {
        if (url.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("REQUEST", requestData)
        }
        await delay(257)
      }

      if (watcher) {
        if (url.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("HEADERS", options.headers)
          // console.log(`Received url: ${resource}`)
          // return
          await delay(257)
        }
      }

      // Gunakan mutex untuk melindungi akses ke "x-trigger-web-ext"
      let shouldCallOriginalFetch = true
      if (watcher && url.includes(watcher.matchSourceUrl)) {
        watcher.setPhase("FETCH", options)
        await delay(257)

        shouldCallOriginalFetch = await triggerMutex.withLock(async () => {
          const triggeredFromX = await idb.get("x-trigger-web-ext")
          if (triggeredFromX) {
            await idb.set("x-trigger-web-ext", false)
            // Jangan panggil fetch asli jika di-trigger dari ekstensi
            return false
          }
          return true // Lanjut dengan fetch asli
        })
      }
      console.log({ shouldCallOriginalFetch, watcher })
      // Panggil fetch palsu jika tidak diintercept
      if (!shouldCallOriginalFetch && watcher) {
        if (bridge.appName === "zai-proxy") {
          // Gunakan URL palsu untuk semua URL, bukan hanya yang cocok dengan watcher
          if (watcher.replaceUrl.trim().length > 0) return await originalFetch.call(this, watcher.replaceUrl)
        }
      }

      const response = await originalFetch.call(this, url, options)
      if (watcher) {
        if (url.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("RESPONSE", null)
          await delay(257)
        }
      }
      // Clone the response to allow reading its body multiple times
      const responseClone = response.clone()

      // Prioritize handling as stream first
      const isStreamResponse = response.headers.get("content-type")?.includes("text/event-stream") || response.headers.get("content-type")?.includes("application/octet-stream") || response.body?.locked === true

      if (isStreamResponse) {
        console.log("response is stream")
        // Response is a stream, log basic info without trying to read body
        /* console.log("[CRXJS] Fetch response (stream):", {
          url: typeof url === "string" ? url : (url as any).url || url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        })*/
        const updatePashe = async () => {
          const streamResponse = await streamToResponse(response)
          // Send response data to socket.io server without body
          const responseData = {
            type: "fetch_response",
            timestamp: Date.now(),
            url: typeof url === "string" ? url : (url as any).url || url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: streamResponse,
          }
          // bridge.sendMessage(responseData)
          if (watcher) {
            if (url.includes(watcher.matchSourceUrl)) {
              watcher.setPhase("DATA", responseData)
            }
          }
        }
        updatePashe()
        return response
      } else {
        // Not a stream, try to read the body as text
        try {
          const responseBody = await responseClone.text()
          /*  console.log("[CRXJS] Fetch response:", {
            url: typeof url === "string" ? url : (url as any).url || url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
          })*/

          // Send response data to socket.io server
          const responseData = {
            type: "fetch_response",
            timestamp: Date.now(),
            url: typeof url === "string" ? url : (url as any).url || url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
          }
          // bridge.sendMessage(responseData)
          if (watcher) {
            if (url.includes(watcher.matchSourceUrl)) {
              watcher.setPhase("DATA", responseData)
            }
          }
        } catch (e) {
          // Response couldn't be read as text, log basic info
          /*
          console.log("[CRXJS] Fetch response (unreadable):", {
            url: typeof url === "string" ? url : (url as any).url || url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          })
            */

          // Send response data to socket.io server without body
          const responseData = {
            type: "fetch_response",
            timestamp: Date.now(),
            url: typeof url === "string" ? url : (url as any).url || url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          }
          // bridge.sendMessage(responseData)
          if (watcher) {
            if (url.includes(watcher.matchSourceUrl)) {
              watcher.setPhase("DATA", responseData)
            }
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
        url: typeof url === "string" ? url : (url as any).url || url,
        error: error instanceof Error ? error.message : String(error),
      }
      // bridge.sendMessage(errorData)
      if (watcher) {
        if (url.includes(watcher.matchSourceUrl)) {
          watcher.setPhase("ERROR", errorData)
        }
      }

      throw error // Re-throw the error to maintain original behavior
    }
  }
}

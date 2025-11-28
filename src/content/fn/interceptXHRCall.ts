import type { ProxyBridge } from "../../global/classes/ProxyBridge"
import { Mutex } from "../../global/classes/Mutex"
import { delay } from "../../utils"
import * as idb from "idb-keyval"
import { triggerChangeEvent } from "../../global/fn/triggerInputElChangeEvent"

// Buat instance mutex global untuk melindungi akses ke "x-trigger-web-ext"
const triggerMutex = new Mutex()

export async function interceptXHRCall(bridge: ProxyBridge) {
  // Store the original XMLHttpRequest constructor
  const OriginalXHR = window.XMLHttpRequest

  // Override the global XMLHttpRequest
  window.XMLHttpRequest = class extends OriginalXHR {
    private _url: string | undefined
    private _method: string = "GET"
    private _requestHeaders: Record<string, string> = {}
    private _requestBody: Document | XMLHttpRequestBodyInit | null | undefined
    private _watcher = bridge.watcher

    constructor() {
      super()

      // Override the open method to capture URL and method
      const originalOpen = this.open
      this.open = function (method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
        this._method = method.toUpperCase()
        this._url = typeof url === "string" ? url : url.toString()

        // Call the original open method
        return originalOpen.call(this, method, url, async !== undefined ? async : true, user, password)
      }

      // Override the setRequestHeader method to capture headers
      const originalSetRequestHeader = this.setRequestHeader
      this.setRequestHeader = function (header: string, value: string) {
        this._requestHeaders[header] = value
        return originalSetRequestHeader.call(this, header, value)
      }

      // Override the send method to intercept the request
      const originalSend = this.send
      this.send = async function (body?: Document | XMLHttpRequestBodyInit | null) {
        this._requestBody = body
        const options = {
          url: this._url,
          method: this._method,
          headers: this._requestHeaders,
          body: body,
        }

        try {
          // Prepare request data to send to socket.io server
          const requestData = {
            type: "xhr_request",
            timestamp: Date.now(),
            ...options,
          }

          // Send request data to socket.io server
          // bridge.sendMessage(requestData)
          if (this._watcher) {
            if (this._url?.includes(this._watcher.matchSourceUrl)) {
              this._watcher.setPhase("REQUEST", requestData)
            }
            await delay(257)
          }

          if (this._watcher) {
            if (this._url?.includes(this._watcher.matchSourceUrl)) {
              this._watcher.setPhase("HEADERS", options.headers)
              await delay(257)
            }
          }
          let matchGeminiEndpoint = false
          let shouldCallOriginalXHR = true

          const matchUrl = "/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate"
          if (this._url?.includes(matchUrl)) {
            console.log("MATCH GEMINI CHAT ENDPOINT")
            matchGeminiEndpoint = true
          }
          if (matchGeminiEndpoint) {
            //  const { data, phase, fn } = event.data.payload
            const payload = {
              data: options,
              phase: "FETCH",
              fn: "setPhase",
            }
            window.postMessage({ type: "intercept-xhr", payload }, "*")
            await delay(257)
          }
          // console.log(matchGeminiEndpoint)
          // Set up event listeners to capture the response
          let partialResponseData = ""
          this.addEventListener("readystatechange", async () => {
            // Check if readyState is LOADING (3) to capture partial data
            if (this.readyState === 3) {
              // For streaming responses, we can capture partial data here
              if (this.responseType === "" || this.responseType === "text") {
                try {
                  const partialText = this.responseText
                  if (partialText && partialText.length > partialResponseData.length) {
                    // We have new partial data
                    const newData = partialText.substring(partialResponseData.length)
                    partialResponseData = partialText
                    if (matchGeminiEndpoint) {
                      const payload = {
                        data: newData,
                        phase: "STREAM",
                        fn: "setPhase",
                      }
                      window.postMessage({ type: "intercept-xhr", payload }, "*")
                    }
                  }
                } catch (e) {
                  console.warn("Could not read partial XHR response:", e)
                }
              }
            }
          })

          this.addEventListener("load", async () => {
            if (matchGeminiEndpoint) {
              //  const { data, phase, fn } = event.data.payload
              const payload = {
                data: null,
                phase: "RESPONSE",
                fn: "setPhase",
              }
              window.postMessage({ type: "intercept-xhr", payload }, "*")
              await delay(257)
            }
            try {
              // Get response headers
              const responseHeaders: Record<string, string> = {}
              const headerString = this.getAllResponseHeaders()
              if (headerString) {
                const headers = headerString.split("\r\n")
                for (const header of headers) {
                  const [name, value] = header.split(": ")
                  if (name && value) {
                    responseHeaders[name] = value
                  }
                }
              }

              // Get response data
              let responseData: any = this.response
              if (matchGeminiEndpoint) {
                // console.log("BILLIE EILISH", this.responseType)
              }
              // If response is JSON, try to parse it
              if (this.responseType === "" || this.responseType === "text") {
                try {
                  responseData = JSON.parse(this.responseText)
                } catch (e) {
                  // Not JSON, use the response text as is
                  responseData = this.responseText
                }
              }

              if (matchGeminiEndpoint) {
                const payload = {
                  data: responseData,
                  phase: "DATA",
                  fn: "setPhase",
                }
                window.postMessage({ type: "intercept-xhr", payload }, "*")
              }
            } catch (e) {
              console.error("Error processing XHR response:", e)
            }
          })

          this.addEventListener("error", async () => {
            console.error("[CRXJS] XHR error:", this.status, this.statusText, this._url)

            // Send error to socket.io server
            const errorData = {
              type: "xhr_error",
              timestamp: Date.now(),
              url: this._url,
              status: this.status,
              statusText: this.statusText,
              error: "Network error",
            }

            if (matchGeminiEndpoint) {
              const payload = {
                data: errorData,
                phase: "ERROR",
                fn: "setPhase",
              }
              window.postMessage({ type: "intercept-xhr", payload }, "*")
            }
          })

          // Call the original send method
          return originalSend.call(this, body)
        } catch (error) {
          console.error("[CRXJS] XHR error:", error)

          // Send error to socket.io server
          // const errorData = {
          //   type: "xhr_error",
          //   timestamp: Date.now(),
          //   url: this._url,
          //   error: error instanceof Error ? error.message : String(error),
          // }

          throw error // Re-throw the error to maintain original behavior
        }
      }
    }
  }
}

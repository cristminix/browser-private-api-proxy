import * as idb from "idb-keyval"
import { crc32 } from "../../utils"
import { EventEmitter } from "./EventEmitter"
import type { ProxyBridge } from "./ProxyBridge"

// Define types for better type safety
export type FetchPhase = "INIT" | "REQUEST" | "HEADERS" | "RESPONSE" | "ERROR" | "DATA" | "FETCH"

export interface FetchPhaseData {
  phase?: FetchPhase
  [key: string]: any
}

// Global event bus for fetch events
const fetchEventBus = new EventEmitter()

export class FetchResponseEventWatcher {
  private requestId: string = "x"
  public matchSourceUrl: string = ""
  public replaceUrl: string = ""
  private timeout: number = 6000
  private phase: FetchPhase = "INIT"
  private checksum: string = ""
  private phaseData: FetchPhaseData | null = null
  private timeoutId: NodeJS.Timeout | null = null
  private eventListener: Function | null = null

  constructor(matchSourceUrl: string, timeout: number, requestId: string, replaceUrl: string) {
    this.matchSourceUrl = matchSourceUrl
    this.timeout = timeout
    this.checksum = crc32(matchSourceUrl)
    this.requestId = requestId
    this.replaceUrl = replaceUrl

    console.log("CHECKSUM", this.checksum)
  }
  getPhaseKey() {
    return `data-${this.requestId}-${this.checksum}`
  }
  setPhase(phase: FetchPhase, data: any): void {
    // console.log({ data })
    const dataSent = { requestId: this.requestId, ...data }
    this.phase = phase
    idb.set(this.getPhaseKey(), dataSent)

    // Emit event to notify subscribers
    fetchEventBus.emit(`phase:${this.getPhaseKey()}`, { phase, data: dataSent })
  }

  async getPhaseData(): Promise<FetchPhaseData | undefined> {
    return idb.get(this.getPhaseKey())
  }
  async watchGemini(bridge: ProxyBridge) {
    console.log("WATCHING_GEMINI_RESPONSE")
    this.phase = "INIT"

    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(() => {
        if (this.phase === "INIT") {
          // Cleanup observers and event listeners on timeout
          const targetEl = document.getElementById("output-script") as HTMLTextAreaElement
          if (targetEl) {
            if ((targetEl as any).__mutationObserver) {
              ;(targetEl as any).__mutationObserver.disconnect()
            }
            if ((targetEl as any).__contentObserver) {
              ;(targetEl as any).__contentObserver.disconnect()
            }
            if ((targetEl as any).__inputHandler) {
              targetEl.removeEventListener("input", (targetEl as any).__inputHandler)
            }
          }
          reject(new Error(`Timeout waiting for fetch response from ${this.matchSourceUrl}`))
        }
      }, this.timeout)

      const targetEl = document.getElementById("output-script") as HTMLTextAreaElement

      if (targetEl) {
        // Create a MutationObserver to monitor changes to the textarea value
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "value") {
              console.log("Value changed in output-script attr:", targetEl.value)
              handleInput()
            }
          })
        })

        // Also monitor for changes to the element's text content
        const contentObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
              console.log("Content changed in output-script:", targetEl.value)
            }
          })
        })

        // Start observing attribute changes (for value attribute changes)
        observer.observe(targetEl, {
          attributes: true,
          attributeFilter: ["value"],
        })

        // Start observing child list changes (for text content changes)
        contentObserver.observe(targetEl, {
          childList: true,
        })

        // Additionally, still listen for input events to catch user typing
        const handleInput = async () => {
          console.log("Value changed in output-script change callback:", targetEl.value)
          if (!targetEl.value.includes("[DONE]")) {
            this.setPhase("RESPONSE", { content: targetEl.value })
            if (bridge.socket) {
              bridge.socket.emit("answer-stream", { content: targetEl.value, requestId: this.requestId })
            }
          } else {
            this.setPhase("DATA", { content: targetEl.value })
            if (bridge.socket) {
              bridge.socket.emit("answer-stream", { content: targetEl.value, requestId: this.requestId })
            }

            // Cleanup observers and event listeners
            if ((targetEl as any).__mutationObserver) {
              ;(targetEl as any).__mutationObserver.disconnect()
            }
            if ((targetEl as any).__contentObserver) {
              ;(targetEl as any).__contentObserver.disconnect()
            }
            if ((targetEl as any).__inputHandler) {
              targetEl.removeEventListener("input", (targetEl as any).__inputHandler)
            }

            resolve(await this.getPhaseData())
          }
        }
        // Store observer references if needed for later cleanup
        ;(targetEl as any).__mutationObserver = observer
        ;(targetEl as any).__contentObserver = contentObserver
        ;(targetEl as any).__inputHandler = handleInput

        targetEl.addEventListener("input", handleInput)
      } else {
        console.warn("Element with id 'output-script' not found")
      }
    })
  }
  async watch(breakOnPhase: string = "FETCH"): Promise<FetchPhaseData> {
    return new Promise<FetchPhaseData>((resolve, reject) => {
      // Set up timeout
      this.timeoutId = setTimeout(() => {
        if (this.phase === "INIT") {
          if (this.eventListener) {
            fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener)
          }
          reject(new Error(`Timeout waiting for fetch response from ${this.matchSourceUrl}`))
        }
      }, this.timeout)

      // Set up event listener for phase changes
      this.eventListener = ({ phase, data }: { phase: FetchPhase; data: any }) => {
        this.phase = phase
        this.phaseData = { ...data, phase }

        console.log(`Phase changed to: ${phase}`)

        // Handle different phases
        switch (phase) {
          case "ERROR":
            if (this.timeoutId) clearTimeout(this.timeoutId)
            if (this.eventListener) {
              fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener)
            }
            reject(new Error(`Error in fetch response: ${JSON.stringify(data)}`))
            break
          case "DATA":
          case "FETCH":
            if (phase === breakOnPhase) {
              if (this.timeoutId) clearTimeout(this.timeoutId)
              if (this.eventListener) {
                fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener)
              }
              if (this.phaseData) {
                resolve(this.phaseData)
              } else {
                reject(new Error("Phase data is null when trying to resolve"))
              }
            }
            break
          // Other phases are just logged but don't resolve the promise
          default:
            // Continue waiting
            break
        }
      }

      // Register the event listener
      fetchEventBus.on(`phase:${this.getPhaseKey()}`, this.eventListener)

      // Check if there's already data in IndexedDB
      this.getPhaseData().then((existingData) => {
        if (existingData && existingData.phase && this.eventListener) {
          // Simulate an event for existing data
          this.eventListener({ phase: existingData.phase, data: existingData })
        }
      })
    })
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.eventListener) {
      fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener)
      this.eventListener = null
    }
  }
}

export { fetchEventBus }

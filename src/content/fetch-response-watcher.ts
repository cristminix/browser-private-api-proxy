import * as idb from "idb-keyval"
import { crc32 } from "../utils"

// Define types for better type safety
type FetchPhase = "INIT" | "REQUEST" | "HEADERS" | "RESPONSE" | "ERROR" | "DATA" | "FETCH"

interface FetchPhaseData {
  phase?: FetchPhase
  [key: string]: any
}

// Simple EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {}

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return

    const index = this.events[event].indexOf(listener)
    if (index >= 0) {
      this.events[event].splice(index, 1)
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return

    this.events[event].forEach((listener) => {
      listener(...args)
    })
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper)
      listener(...args)
    }
    this.on(event, onceWrapper)
  }
}

// Global event bus for fetch events
const fetchEventBus = new EventEmitter()

class FetchResponseEventWatcher {
  private requestId: string = "x"
  private matchSourceUrl: string = ""
  private timeout: number = 6000
  private phase: FetchPhase = "INIT"
  private checksum: string = ""
  private phaseData: FetchPhaseData | null = null
  private timeoutId: NodeJS.Timeout | null = null
  private eventListener: Function | null = null

  constructor(matchSourceUrl: string, timeout: number, requestId: string) {
    this.matchSourceUrl = matchSourceUrl
    this.timeout = timeout
    this.checksum = crc32(matchSourceUrl)
    this.requestId = requestId

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

  async watch(): Promise<FetchPhaseData> {
    return new Promise<FetchPhaseData>((resolve, reject) => {
      // Set up timeout
      this.timeoutId = setTimeout(() => {
        if (this.phase === "INIT") {
          fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener!)
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
            fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener!)
            reject(new Error(`Error in fetch response: ${JSON.stringify(data)}`))
            break
          case "DATA":
          case "FETCH":
            if (this.timeoutId) clearTimeout(this.timeoutId)
            fetchEventBus.off(`phase:${this.getPhaseKey()}`, this.eventListener!)
            if (this.phaseData) {
              resolve(this.phaseData)
            } else {
              reject(new Error("Phase data is null when trying to resolve"))
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
        if (existingData && existingData.phase) {
          // Simulate an event for existing data
          this.eventListener!({ phase: existingData.phase, data: existingData })
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

export { FetchResponseEventWatcher, fetchEventBus }
export type { FetchPhase, FetchPhaseData }

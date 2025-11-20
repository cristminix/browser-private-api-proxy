import * as idb from "idb-keyval"
import { crc32 } from "../../utils"
import { EventEmitter } from "./EventEmitter"

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

export { fetchEventBus }

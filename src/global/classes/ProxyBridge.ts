// Establish socket.io connection to proxy server
import io from "socket.io-client"
import jquery from "jquery"
import { triggerChangeEvent } from "../fn/triggerInputElChangeEvent"

import { delay } from "../../utils"
import { Socket } from "socket.io-client"
import * as idb from "idb-keyval"
import { FetchResponseEventWatcher } from "./FetchResponseEventWatcher"
import { Mutex } from "./Mutex"
import type { PlatformStrategy } from "../interfaces/PlatformStrategy"
import { ZaiStrategy } from "../strategies/ZaiStrategy"
import { OreillyStrategy } from "../strategies/OreillyStrategy"
import { GenericStrategy } from "../strategies/GenericStrategy"

// Buat instance mutex global untuk melindungi akses ke "x-trigger-web-ext"
const triggerMutex = new Mutex()

export class ProxyBridge {
  socketUrl = "http://localhost:4001"
  socketConnected = false
  socket: Socket | null = null
  socketLastError: any = null
  socketTimeout = 5000
  socketExitTimeout = 6000
  appName = "generic-proxy"
  watcher: FetchResponseEventWatcher | null = null
  private strategy: PlatformStrategy

  constructor() {
    this.socket = io(this.socketUrl, {
      // Disable automatic reconnection to allow the program to exit when server is not available
      autoConnect: true,
      reconnection: true, // Disable reconnection attempts
      timeout: this.socketTimeout, // 5 second timeout for connection attempts
      transports: ["websocket"], // Use only websocket transport
    })

    // Initialize strategy based on current hostname
    this.strategy = this.initializeStrategy()
    this.appName = this.strategy.name
    console.log("APP_NAME", this.appName)
    this.initSocketCallback()
  }

  /**
   * Initialize the appropriate strategy based on the current hostname
   */
  private initializeStrategy(): PlatformStrategy {
    const hostname = window.location.hostname
    const strategies: PlatformStrategy[] = [
      new ZaiStrategy(),
      new OreillyStrategy(),
      new GenericStrategy(),
    ]

    for (const strategy of strategies) {
      if (strategy.isMatch(hostname)) {
        return strategy
      }
    }

    // Default to generic strategy if no match is found
    return new GenericStrategy()
  }

  /**
   * Update strategy (useful for testing or dynamic switching)
   */
  setStrategy(strategy: PlatformStrategy): void {
    this.strategy = strategy
    this.appName = strategy.name
  }

  setWatcher(watcher: FetchResponseEventWatcher) {
    this.watcher = watcher
  }
  unsetWatcher() {
    this.watcher = null
  }
  getWatcher() {
    return this.watcher
  }
  async onChat(payload: any, requestId: string) {
    // Delegate to strategy
    await this.strategy.handleChat(payload, requestId, this)
  }

  onMessage(data: any) {
    if (!data) return
    const { type, payload, requestId } = data
    switch (type) {
      case "chat":
        this.onChat(payload, requestId)
        break
    }
    console.log("Received message from server:", data)
  }
  sendHeartBeat() {
    if (this.socket) {
      this.socket.emit("heartbeat", { appName: this.appName })
    }
  }
  initSocketCallback() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("CONNECTED")
      this.socketConnected = true
    })
    this.socket.on("connected", () => {
      this.socketConnected = true
      this.sendHeartBeat()
    })
    this.socket.on("heartbeat", () => {
      // console.log("HEARTBEAT")
      // this.socketConnected = true
      this.sendHeartBeat()
    })
    this.socket.on("new-chat", (data: any) => {
      this.strategy.handleNewChat()
    })
    this.socket.on("chat-reload", (data: any) => {
      this.strategy.handleChatReload()
    })
    this.socket.on("chat", async (data: any) => {
      console.log("CHAT")
      // Delegate to strategy
      await this.strategy.handleChatEvent(data, this)
    })
    this.socket.on("connect_error", (error: any) => {
      console.error("Failed to connect to Socket.IO server:", error.message)
      this.socketLastError = error
      this.socketConnected = false
    })

    this.socket.on("error", (error: any) => {
      console.error("Socket.IO error:", error)
      this.socketLastError = error
      this.socketConnected = false
    })

    this.socket.on("message", (data: any) => {
      this.onMessage(data)
    })

    this.socket.on("disconnect", (reason: any) => {
      console.log("Socket.IO connection closed:", reason)
      this.socketConnected = false
    })
  }
  sendMessage(message: any) {
    if (this.socket) {
      this.socket.emit("message", message)
    }
  }
  async sendMessageAsync(message: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket is not initialized"))
        return
      }

      // Timeout yang akan dibersihkan
      const timeoutId = setTimeout(() => {
        if (this.socket) this.socket.off("message", messageHandler)
        reject(new Error("Socket message timeout after 6000ms"))
      }, 6000)

      const messageHandler = (data: unknown) => {
        clearTimeout(timeoutId)
        this.onMessage(data)

        if (data && typeof data === "object" && "type" in data) {
          if (
            data.type === "pong" &&
            message &&
            typeof message === "object" &&
            "type" in message &&
            message.type === "ping"
          ) {
            resolve(data)
            return
          }
        }

        resolve(data)
      }

      this.socket.emit("message", message)
      this.socket.once("message", messageHandler) // Menggunakan once untuk auto-cleanup
    })
  }
}

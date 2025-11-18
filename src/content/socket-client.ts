// Establish socket.io connection to proxy server
import io from "socket.io-client"
import jquery from "jquery"
import { triggerChangeEvent } from "./event-listeners"

import { delay } from "../utils"
import { FetchResponseEventWatcher } from "./fetch-response-watcher"
import { Socket } from "socket.io-client"

class ProxyBridge {
  socketUrl = "http://localhost:4001"
  socketConnected = false
  socket: Socket | null = null
  socketLastError: any = null
  socketTimeout = 5000
  socketExitTimeout = 6000
  appName = "generic-proxy"
  watcher: any = null
  constructor() {
    this.socket = io(this.socketUrl, {
      // Disable automatic reconnection to allow the program to exit when server is not available
      autoConnect: true,
      reconnection: true, // Disable reconnection attempts
      timeout: this.socketTimeout, // 5 second timeout for connection attempts
      transports: ["websocket"], // Use only websocket transport
    })

    this.appName = this.determineAppName()
    console.log("APP_NAME", this.appName)
    this.initSocketCallback()
  }
  private determineAppName(): string {
    const hostname = window.location.hostname

    if (hostname.includes("z.ai")) {
      return "zai-proxy"
    }
    if (hostname.includes("learning.oreilly.com")) {
      return "oreally-proxy"
    }

    return "generic-proxy"
  }
  async waitForFetchResponseEvent(matchSourceUrl: string, timeout: number, requestId: string) {
    try {
      // Validate input parameters
      if (!matchSourceUrl || typeof matchSourceUrl !== "string") {
        throw new Error("Invalid matchSourceUrl parameter")
      }

      if (!timeout || timeout <= 0) {
        throw new Error("Invalid timeout parameter")
      }

      // Log the start of the operation
      console.log(`Starting to wait for fetch response event from ${matchSourceUrl} with timeout ${timeout}ms`)

      // Create a new watcher instance
      this.watcher = new FetchResponseEventWatcher(matchSourceUrl, timeout, requestId)

      // Wait for the watcher to complete
      const data = await this.watcher.watch()

      if (data) {
        console.log("RECEIVED DATA", data)
        // bridge.sendMessage(data)
        if (this.socket) {
          this.socket.emit("answer", data)
        }
      } else {
        console.warn(`No data received for ${matchSourceUrl} within timeout period`)
      }

      return data
    } catch (error) {
      console.error(`Error in waitForFetchResponseEvent for ${matchSourceUrl}:`, error)
      throw error // Re-throw to allow caller to handle the error
    }
  }
  async onChat(payload: any, requestId: string) {
    // alert(`onChat(${JSON.stringify(payload)},${requestId})`)
    const { prompt } = payload
    const chatInput = jquery("#chat-input")
    const chatInputElem = chatInput[0]
    const sendButton = jquery("#send-message-button")
    //
    chatInput.val(prompt)

    // Add event listeners to capture keystrokes and changes on the chat input
    if (chatInputElem) {
      //@ts-ignore
      triggerChangeEvent(chatInputElem)
      await delay(256)
      sendButton.trigger("click")
      await this.waitForFetchResponseEvent("/api/v2/chat/completions", 6000, requestId)
    }
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
      console.log("HEARTBEAT")
      // this.socketConnected = true
      this.sendHeartBeat()
    })
    this.socket.on("new-chat", (data: any) => {
      jquery("#sidebar-new-chat-button").trigger("click")
    })
    this.socket.on("chat-reload", (data: any) => {
      jquery("#sidebar-new-chat-button").trigger("click")
      setTimeout(() => {
        // document.location.reload()
        window.history.back()
      }, 3000)
    })
    this.socket.on("chat", async (data: any) => {
      console.log("CHAT")
      // jquery("#sidebar-new-chat-button").trigger("click")
      // await delay(1000)

      //web search
      /*
      jquery("span:contains('Web Search')").closest('button').click()

      */

      if (!data) return
      const { type, payload, requestId } = data
      // const { thinkEnabled } = payload
      // if (!thinkEnabled) jquery("button[data-autothink]").trigger("click")

      await delay(1000)
      this.onChat(payload, requestId)

      // this.socketConnected = true
      // this.sendHeartBeat()
    })
    this.socket.on("connect_error", (error: any) => {
      console.error("Failed to connect to Socket.IO server:", error.message)
      console.log("Exiting program as server is not available...")
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
          if (data.type === "pong" && message && typeof message === "object" && "type" in message && message.type === "ping") {
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

const bridge = new ProxyBridge()

export { bridge }

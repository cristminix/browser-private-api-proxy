// Establish socket.io connection to proxy server
import io from "socket.io-client"
import jquery from "jquery"
import { triggerChangeEvent } from "./event-listeners"
import * as idb from "idb-keyval"
import { crc32, delay } from "../utils"

class FetchResponseEventWatcher {
  requsetId: string = ""
  matchSourceUrl: string = ""
  timeout: number = 6000
  phase: string = "INIT"
  checksum: string = ""
  phaseData: any = null
  stopWatcher = false

  constructor(matchSourceUrl: string, timeout: number) {
    this.matchSourceUrl = matchSourceUrl
    this.timeout = timeout
    this.checksum = crc32(matchSourceUrl)

    console.log("CHECKSUM", this.checksum)
  }
  setPhase(phase: string, data: any) {
    console.log({ data })
    this.phase = phase
    // this.phaseData = data
    idb.set(`data-${this.checksum}`, data)
  }
  async getPhaseData() {
    return idb.get(`data-${this.checksum}`)
  }
  async watch() {
    this.stopWatcher = false
    let iteration = 0
    setTimeout(() => {
      if (this.phase === "INIT") {
        this.stopWatcher = true
      }
    }, this.timeout)
    return new Promise(async (resolve, reject) => {
      let success = false
      while (!this.stopWatcher) {
        console.log(this.phase, iteration)
        this.phaseData = await this.getPhaseData()
        if (this.phase === "INIT") {
        } else if (this.phase === "REQUEST") {
          // console.log(this.phaseData)
        } else if (this.phase === "HEADERS") {
          // console.log(this.phaseData)
        } else if (this.phase === "RESPONSE") {
          // console.log(this.phaseData)
          // this.stopWatcher = true
        } else if (this.phase === "ERROR") {
          // console.log(this.phaseData)
          this.stopWatcher = true
        } else if (this.phase === "DATA") {
          success = true
          // console.log(this.phaseData)
          this.stopWatcher = true
        }
        if (iteration === 500) {
          break
        }
        iteration += 1
        await delay(256)
      }
      if (success) {
        resolve(this.phaseData)
      } else {
        reject(null)
      }
    })
  }
}

class ProxyBridge {
  socketUrl = "http://localhost:4001"
  socketConnected = false
  socket: any = null
  socketLastError: any = null
  socketTimeout = 5000
  socketExitTimeout = 6000
  appName = "zai-proxy"
  watcher: any = null
  constructor() {
    this.socket = io(this.socketUrl, {
      // Disable automatic reconnection to allow the program to exit when server is not available
      autoConnect: true,
      reconnection: true, // Disable reconnection attempts
      timeout: this.socketTimeout, // 5 second timeout for connection attempts
      transports: ["websocket"], // Use only websocket transport
    })
    this.initSocketCallback()
  }
  async waitForFetchResponseEvent(matchSourceUrl: string, timeout: number) {
    this.watcher = new FetchResponseEventWatcher(matchSourceUrl, timeout)
    const data = await this.watcher.watch()

    if (data) {
      console.log("RECEIVED DATA", data)
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
      setTimeout(() => {
        sendButton.trigger("click")
      }, 256)
    }
    await this.waitForFetchResponseEvent("/api/v2/chat/completions", 6000)
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
    this.socket.emit("heartbeat", { appName: this.appName })
  }
  initSocketCallback() {
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
    this.socket.on("chat", (data: any) => {
      console.log("CHAT")

      if (!data) return
      const { type, payload, requestId } = data

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
  async sendMessage(message: any) {
    this.socket.emit("message", message)
  }
  async sendMessageAsync(message: any) {
    return new Promise((resolve, reject) => {
      this.socket.emit("message", message)

      this.socket.off("message")
      this.socket.on("message", (data: any) => {
        this.onMessage(data)
        // console.log({ data, message })
        if (data.type === "pong" && message.type === "ping") resolve(data)
        resolve(data)
      })
      setTimeout(() => {
        reject(null)
      }, this.socketExitTimeout) // Slightly longer than the socket timeout
    })
  }
  exitWhileSocketLost() {
    // Set a timeout to exit the program if connection is not established within a reasonable time

    setTimeout(() => {
      if (!this.socket.connected) {
        console.log("Connection timeout: Server not available, exiting...")
        process.exit(1)
      }
    }, this.socketExitTimeout) // Slightly longer than the socket timeout
  }
}

const bridge = new ProxyBridge()

export { bridge }

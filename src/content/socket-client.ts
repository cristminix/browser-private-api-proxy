// Establish socket.io connection to proxy server
import io from "socket.io-client"
class ProxyBridge {
  socketUrl = "http://localhost:4001"
  socketConnected = false
  socket: any = null
  socketLastError: any = null
  socketTimeout = 5000
  socketExitTimeout = 6000
  appName = "zai-proxy"
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
  onChat(payload: any, requestId: string) {
    alert(`onChat(${JSON.stringify(payload)},${requestId})`)
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

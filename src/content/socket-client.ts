// Establish socket.io connection to proxy server
let socket: any | null = null;

// Function to send data to socket.io server
const sendToSocket = (data: any) => {
  if (socket && socket.connected) {
    try {
      socket.emit("message", data);
    } catch (error) {
      console.error("[CRXJS] Error sending data to socket.io server:", error);
    }
  } else {
    console.warn("[CRXJS] Socket.io not ready, queueing message:", data);
    // In a real implementation, you might want to queue messages for later sending
  }
};

const connectSocket = () => {
  try {
    // Check if socket.io client is available in the page
    if (typeof window.io !== "undefined") {
      socket = window.io("http://localhost:4001");

      socket.on("connect", () => {
        console.log(
          "[CRXJS] Connected to socket.io server at http://localhost:4001"
        );
      });

      socket.on("connect_error", (error: any) => {
        console.error("[CRXJS] Socket.io connection error:", error);
      });

      socket.on("disconnect", (reason: any) => {
        console.log("[CRXJS] Socket.io connection disconnected:", reason);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectSocket, 3000);
      });

      socket.on("message", (data: any) => {
        console.log("[CRXJS] Received message from socket.io server:", data);
        // Handle incoming messages from the socket.io server if needed
        try {
          // Process server messages if needed
        } catch (e) {
          console.warn("[CRXJS] Could not parse socket.io message:", data);
        }
      });
    } else {
      console.error(
        "[CRXJS] Socket.io client not found in window. Make sure to load socket.io client script first."
      );
    }
  } catch (error) {
    console.error("[CRXJS] Failed to connect to socket.io server:", error);
    // Attempt to reconnect after 3 seconds
    setTimeout(connectSocket, 3000);
  }
};

// Connect to socket.io server when script loads
connectSocket();

export { socket, sendToSocket };

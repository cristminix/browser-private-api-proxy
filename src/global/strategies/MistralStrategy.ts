import type { PlatformStrategy } from "../interfaces/PlatformStrategy"
import jquery from "jquery"
import { delay } from "../../utils"
import * as idb from "idb-keyval"
import { Mutex } from "../classes/Mutex"
import type { ProxyBridge } from "../classes/ProxyBridge"
import { FetchResponseEventWatcher } from "../classes/FetchResponseEventWatcher"
import { triggerChangeEvent } from "../fn/triggerInputElChangeEvent"

// Buat instance mutex untuk melindungi akses ke "x-trigger-web-ext"
const triggerMutex = new Mutex()

/**
 * Implementasi strategi untuk platform Z.AI
 */
export class MistralStrategy implements PlatformStrategy {
  readonly name = "mistral-proxy"

  /**
   * Memeriksa apakah hostname cocok dengan platform Z.AI
   */
  isMatch(hostname: string): boolean {
    return hostname.includes("mistral.ai")
  }

  /**
   * Mengembalikan URL pengganti untuk fetch response event
   */
  getReplaceUrl(): string {
    return "http://127.0.0.1:4001/api/fake-stream-chat?platform=mistral.ai"
  }

  /**
   * Menangani permintaan chat dari server
   */
  async handleChat(
    payload: any,
    requestId: string,
    bridge: ProxyBridge
  ): Promise<void> {
    const { prompt } = payload
    const chatInput = jquery("form div[contenteditable=true]")
    const chatInputElem = chatInput[0]

    chatInput.text(prompt)

    // Add event listeners to capture keystrokes and changes on the chat input
    if (chatInputElem) {
      // triggerChangeEvent(chatInputElem as HTMLInputElement)
      await delay(1000)
      const sendButton = jquery("form button[type=submit]")

      console.log(sendButton)
      sendButton.trigger("click")

      // Menunggu respons fetch dengan timeout
      await this.waitForFetchResponseEvent("/api/chat", 6000, requestId, bridge)
    }
  }

  /**
   * Menangani event new-chat dari server
   */
  handleNewChat(): void {
    jquery("#sidebar-new-chat-button").trigger("click")
  }

  /**
   * Menangani event chat-reload dari server
   */
  handleChatReload(): void {
    jquery("#sidebar-new-chat-button").trigger("click")
    setTimeout(() => {
      // document.location.reload()
      window.history.back()
    }, 3000)
  }

  /**
   * Menangani event chat dari server
   */
  async handleChatEvent(data: any, bridge: ProxyBridge): Promise<void> {
    if (!data) return

    const { type, payload, requestId } = data

    // Gunakan mutex untuk melindungi akses ke "x-trigger-web-ext"
    await triggerMutex.withLock(async () => {
      await idb.set("x-trigger-web-ext", true)
    })

    await delay(1000)
    await this.handleChat(payload, requestId, bridge)
  }

  /**
   * Menunggu respons fetch event (dipindahkan dari ProxyBridge)
   */
  private async waitForFetchResponseEvent(
    matchSourceUrl: string,
    timeout: number,
    requestId: string,
    bridge: ProxyBridge
  ): Promise<any> {
    try {
      // Import secara dinamis untuk menghindari circular dependency

      // Create a new watcher instance
      const watcher = new FetchResponseEventWatcher(
        matchSourceUrl,
        timeout,
        requestId,
        this.getReplaceUrl()
      )
      bridge.setWatcher(watcher)
      // Wait for the watcher to complete
      const data = await watcher.watch("DATA")

      if (data) {
        console.log("RECEIVED DATA", data)
        // Kirim data melalui socket (perlu referensi ke socket)
        // Ini akan ditangani oleh ProxyBridge
        if (bridge.socket) {
          bridge.socket.emit("answer", data)
          bridge.unsetWatcher()
        }
      } else {
        console.warn(
          `No data received for ${matchSourceUrl} within timeout period`
        )
      }

      return data
    } catch (error) {
      console.error(
        `Error in waitForFetchResponseEvent for ${matchSourceUrl}:`,
        error
      )
      throw error
    }
  }
}

import type { PlatformStrategy } from "../interfaces/PlatformStrategy"
import { delay } from "../../utils"
import * as idb from "idb-keyval"
import { Mutex } from "../classes/Mutex"
import type { ProxyBridge } from "../classes/ProxyBridge"
import { FetchResponseEventWatcher } from "../classes/FetchResponseEventWatcher"
// import { triggerChangeEvent } from "../fn/triggerInputElChangeEvent"
// import { triggerTypingToTextarea } from "../fn/triggerTypingToTextarea"
//@ts-ignore
import reactTriggerChange from "react-trigger-change"
// Buat instance mutex untuk melindungi akses ke "x-trigger-web-ext"
//@ts-ignore

window.reactTriggerChange = reactTriggerChange
const triggerMutex = new Mutex()

/**
 * Implementasi strategi untuk platform Z.AI
 */
export class DeepSeekStrategy implements PlatformStrategy {
  readonly name = "deepseek-proxy"

  /**
   * Memeriksa apakah hostname cocok dengan platform Z.AI
   */
  isMatch(hostname: string): boolean {
    return hostname.includes("deepseek.com")
  }
  handleGetCurrentChat(bridge: ProxyBridge) {
    // for example https://chat.deepseek.com/a/chat/s/9eb2e582-5626-405e-85b7-22bd441f8581
    const currentLocation = document.location.href
    const match = currentLocation.match(/\/chat\/s\/([a-f0-9-]+)/)
    const chatId = match ? match[1] : null

    if (bridge.socket) {
      bridge.socket.emit("return-chat-id", { chatId })
      // bridge.unsetWatcher()
    }
  }
  /**
   * Mengembalikan URL pengganti untuk fetch response event
   */
  getReplaceUrl(): string {
    return "http://127.0.0.1:4001/api/fake-stream-chat?platform=deepseek"
  }

  /**
   * Menangani permintaan chat dari server
   */
  async handleChat(payload: any, requestId: string, bridge: ProxyBridge): Promise<void> {
    const { prompt } = payload
    const chatInput = document.querySelector("textarea[placeholder='Message DeepSeek']") as HTMLTextAreaElement

    if (chatInput) {
      chatInput.value = prompt

      // Add event listeners to capture keystrokes and changes on the chat input
      reactTriggerChange(chatInput)
      await delay(2000)

      // Mencari tombol kirim - mencari elemen setelah input[type=file]
      const fileInput = document.querySelector("input[type=file]") as HTMLInputElement
      const sendButton = fileInput?.parentElement?.querySelector("button") as HTMLElement

      if (sendButton) {
        sendButton.click()
      }

      // Menunggu respons fetch dengan timeout
      await this.waitForFetchResponseEvent("/api/v0/chat/completion", 60000, requestId, bridge)
    }
  }

  /**
   * Menangani event new-chat dari server
   */
  handleNewChat(): void {
    const newChatButton = document.querySelector("#sidebar-new-chat-button") as HTMLElement
    if (newChatButton) {
      newChatButton.click()
    }
  }

  /**
   * Menangani event chat-reload dari server
   */
  async handleChatReload(chatId: string | null | undefined = null) {
    const currentLocation = document.location.href
    const match = currentLocation.match(/\/chat\/s\/([a-f0-9-]+)/)
    const currentChatId = match ? match[1] : null
    const chatUrl = `https://chat.deepseek.com/a/chat/s/${chatId}`
    const homeUrl = `https://chat.deepseek.com`

    await delay(3000)
    //
    if (chatId === currentChatId) {
      // history.pushState({}, "", homeUrl)
      // window.dispatchEvent(new PopStateEvent("popstate"))
      // await delay(1000)

      // history.pushState({}, "", chatUrl)
      // window.dispatchEvent(new PopStateEvent("popstate"))

      document.location.reload()
    } else if (chatId) {
      document.location.href = `https://chat.deepseek.com/a/chat/s/${chatId}`
      // history.pushState({}, "", chatUrl)
      // window.dispatchEvent(new PopStateEvent("popstate"))
    }
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
  private async waitForFetchResponseEvent(matchSourceUrl: string, timeout: number, requestId: string, bridge: ProxyBridge): Promise<any> {
    try {
      // Import secara dinamis untuk menghindari circular dependency

      // Create a new watcher instance
      const watcher = new FetchResponseEventWatcher(matchSourceUrl, timeout, requestId, this.getReplaceUrl())
      bridge.setWatcher(watcher)
      // Wait for the watcher to complete
      const data = await watcher.watch()

      if (data) {
        console.log("RECEIVED DATA", data)
        // Kirim data melalui socket (perlu referensi ke socket)
        // Ini akan ditangani oleh ProxyBridge
        if (bridge.socket) {
          bridge.socket.emit("answer", data)
          // bridge.unsetWatcher()
        }
      } else {
        console.warn(`No data received for ${matchSourceUrl} within timeout period`)
      }

      return data
    } catch (error) {
      console.error(`Error in waitForFetchResponseEvent for ${matchSourceUrl}:`, error)
      throw error
    }
  }
}

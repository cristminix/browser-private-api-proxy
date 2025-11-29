import type { PlatformStrategy } from "../interfaces/PlatformStrategy"
import { delay } from "../../utils"
import * as idb from "idb-keyval"
import { Mutex } from "../classes/Mutex"
import type { ProxyBridge } from "../classes/ProxyBridge"
import { FetchResponseEventWatcher } from "../classes/FetchResponseEventWatcher"
import { triggerChangeEvent } from "../fn/triggerInputElChangeEvent"

// Buat instance mutex untuk melindungi akses ke "x-trigger-web-ext"
const triggerMutex = new Mutex()

/**
 * Implementasi strategi untuk platform gemini.google.com
 */
export class GeminiStrategy implements PlatformStrategy {
  readonly name = "gemini-proxy"

  /**
   * Memeriksa apakah hostname cocok dengan platform gemini.google.com
   */
  isMatch(hostname: string): boolean {
    return hostname.includes("gemini.google.com")
  }

  /**
   * Mengembalikan URL pengganti untuk fetch response event
   */
  getReplaceUrl(): string {
    return "http://localhost:4001/api/fake-stream-chat?platform=gemini"
  }
  handleGetCurrentChat(bridge: ProxyBridge) {
    // for example https://gemini.google.com/app/97345126d3c62234?hl=id
    const currentLocation = document.location.href
    const match = currentLocation.match(/\/app\/([a-f0-9-]+)/)
    const chatId = match ? match[1] : null

    if (bridge.socket) {
      bridge.socket.emit("return-chat-id", { chatId })
      // bridge.unsetWatcher()
    }
  }
  /**
   * Menangani permintaan chat dari server
   */
  async handleChat(payload: any, requestId: string, bridge: ProxyBridge): Promise<void> {
    const { prompt } = payload
    const richTextarea = document.querySelector("rich-textarea.text-input-field_textarea.ql-container.ql-bubble")
    const qlEditor = richTextarea ? richTextarea.querySelector(".ql-editor") : null

    if (!richTextarea || !qlEditor) {
      console.warn("Rich text area or editor not found, cannot send message")
      return
    }
    const sendButton = document.querySelector('.text-input-field mat-icon[data-mat-icon-name="send"]')?.parentNode as HTMLElement | null
    if (qlEditor) {
      qlEditor.textContent = prompt
      // or qlEditor.innerHTML = '<p>Your <b>rich</b> text here</p>';
      // Add event listeners to capture keystrokes and changes on the chat input

      await delay(2000)

      if (sendButton) {
        sendButton.click()
      } else {
        console.warn("Send button not found, cannot send message")
      }

      // Menunggu respons fetch dengan timeout
      const matchUrl = "/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate"
      await this.waitForFetchResponseEvent(matchUrl, 60000, requestId, bridge)
    }
  }

  /**
   * Menangani event new-chat dari server
   */
  handleNewChat(): void {
    const newChatButton = document.querySelector("#sidebar-new-chat-button") as HTMLElement | null
    if (newChatButton) {
      newChatButton.click()
    } else {
      console.warn("New chat button not found")
    }
  }

  /**
   * Menangani event chat-reload dari server
   */
  async handleChatReload(chatId: string | null | undefined = null) {
    const currentLocation = document.location.href
    const match = currentLocation.match(/\/c\/([a-f0-9-]+)/)
    const currentChatId = match ? match[1] : null
    //https://chat.gemini.google.com/c/b9821e29-cdf0-4825-9554-4c6ec815b831
    const chatUrl = `https://chat.gemini.google.com/c/${chatId}`
    const homeUrl = `https://chat.gemini.google.com`

    await delay(3000)
    console.log("CHAT_RELOAD", chatId)

    //
    if (chatId === currentChatId) {
      // history.pushState({}, "", homeUrl)
      // window.dispatchEvent(new PopStateEvent("popstate"))
      // await delay(1000)

      // history.pushState({}, "", chatUrl)
      // window.dispatchEvent(new PopStateEvent("popstate"))

      document.location.reload()
    } else if (chatId) {
      document.location.href = `https://chat.gemini.google.com/c/${chatId}`
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
      const data = await watcher.watch("DATA", bridge)

      if (data) {
        console.log("RECEIVED DATA", data)
        // Kirim data melalui socket (perlu referensi ke socket)
        // Ini akan ditangani oleh ProxyBridge
        if (bridge.socket) {
          bridge.socket.emit("answer", data)
          bridge.unsetWatcher()
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

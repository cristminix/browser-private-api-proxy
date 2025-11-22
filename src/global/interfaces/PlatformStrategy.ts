import { Socket } from "socket.io-client"
import type { ProxyBridge } from "../classes/ProxyBridge"

/**
 * Interface untuk strategi platform yang mendefinisikan perilaku spesifik
 * untuk setiap platform yang didukung oleh ProxyBridge
 */
export interface PlatformStrategy {
  handleGetCurrentChat?(bridge: ProxyBridge): void
  /**
   * Nama unik untuk identifikasi platform
   */
  readonly name: string

  /**
   * Memeriksa apakah strategi ini cocok untuk hostname saat ini
   */
  isMatch(hostname: string): boolean

  /**
   * Mengembalikan URL pengganti untuk fetch response event
   */
  getReplaceUrl(): string

  /**
   * Menangani permintaan chat dari server
   */
  handleChat(payload: any, requestId: string, bridge: ProxyBridge): Promise<void>

  /**
   * Menangani event new-chat dari server
   */
  handleNewChat(): void

  /**
   * Menangani event chat-reload dari server
   */
  handleChatReload(): void

  /**
   * Menangani event chat dari server
   */
  handleChatEvent(data: any, bridge: ProxyBridge): Promise<void>
}

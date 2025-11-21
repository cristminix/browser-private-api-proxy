import type { PlatformStrategy } from "../interfaces/PlatformStrategy"
import { FetchResponseEventWatcher } from "../classes/FetchResponseEventWatcher"
import { delay } from "../../utils"

/**
 * Strategi default untuk platform yang tidak dikenali
 */
export class GenericStrategy implements PlatformStrategy {
  readonly name = "generic-proxy"

  isMatch(hostname: string): boolean {
    // Generic strategy cocok untuk semua hostname yang tidak cocok dengan strategi lain
    return true
  }

  getReplaceUrl(): string {
    // Tidak ada URL pengganti untuk platform generik
    return ""
  }

  async handleChat(payload: any, requestId: string): Promise<void> {
    // Implementasi default untuk handle chat
    console.warn(
      "GenericStrategy: handleChat not implemented for this platform"
    )
  }

  handleNewChat(): void {
    // Implementasi default untuk handle new chat
    console.warn(
      "GenericStrategy: handleNewChat not implemented for this platform"
    )
  }

  handleChatReload(): void {
    // Implementasi default untuk handle chat reload
    console.warn(
      "GenericStrategy: handleChatReload not implemented for this platform"
    )
  }

  async handleChatEvent(data: any): Promise<void> {
    // Implementasi default untuk handle chat event
    console.warn(
      "GenericStrategy: handleChatEvent not implemented for this platform"
    )
  }
}

import { injectScript } from "./injectScript"
import type { InjectScriptLoadCallback } from "./types"

export const injectScriptSync = async (src: string, type = "text/javascript", tag = "body", callback: InjectScriptLoadCallback = (f) => f) => {
  return new Promise((resolve, reject) => {
    injectScript(
      chrome.runtime.getURL(src),
      tag,
      type,
      (el) => {
        if (typeof callback === "function") {
          callback(el)
        }
        resolve(el)
      },
      (ev) => {
        reject(ev)
      }
    )
  })
}

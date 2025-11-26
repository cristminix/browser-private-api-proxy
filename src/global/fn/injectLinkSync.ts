import { extGetUrl } from "./extGetUrl"
import { injectLink } from "./injectLink"
import type { InjectLinkLoadCallback } from "./types"

export const injectLinkSync = async (rel: string, href: string, tag = "body", onLoadCallback: InjectLinkLoadCallback = (f) => f) => {
  return new Promise((resolve, reject) => {
    injectLink(
      rel,
      extGetUrl(href),
      tag,
      (linkElem) => {
        if (typeof onLoadCallback === "function") {
          onLoadCallback(linkElem)
        }
        resolve(linkElem)
      },
      (ev) => {
        reject(ev)
      }
    )
  })
}

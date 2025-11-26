import type { InjectLinkErrorCallback, InjectLinkLoadCallback } from "./types"

/**
 * @description Inject a link tag to the head tag
 * @param rel
 * @param href
 * @param tag
 * @param callback
 * @param error
 */
export const injectLink = (rel: string, href: string, tag = "head", callback: InjectLinkLoadCallback = (f) => f, error: InjectLinkErrorCallback = (f) => f) => {
  let injectParentElemQuery = document.getElementsByTagName(tag)
  let injectParentElem: HTMLElement
  if (injectParentElemQuery.length > 0) {
    injectParentElem = injectParentElemQuery[0] as HTMLElement
    let linkElem = document.createElement("link")
    linkElem.addEventListener("load", () => {
      console.log(`${linkElem.href} loaded as link tag`)
      callback(linkElem)
    })
    linkElem.addEventListener("error", (err) => {
      console.log(`Error: injectLink: Error on loading file ${href}`, err)
      error(err)
    })

    linkElem.setAttribute("rel", rel)
    linkElem.setAttribute("crossorigin", "true")
    linkElem.setAttribute("href", href)
    injectParentElem.appendChild(linkElem)
  } else {
    error(`Error: injectLink: parent element ${tag} is not exist as parent of inject`)
  }
}

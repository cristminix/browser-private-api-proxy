import type { InjectScriptErrorCallback, InjectScriptLoadCallback } from "./types"

export const injectScript = (
  src: string,
  tag: string,
  type = "text/javascript",
  onloadCallback: InjectScriptLoadCallback = (f) => f,
  errorCallback: InjectScriptErrorCallback = (f) => f
) => {
  let injectParentElemQuery = document.getElementsByTagName(tag)
  let injectParentElem: HTMLElement
  if (injectParentElemQuery.length > 0) {
    injectParentElem = injectParentElemQuery[0] as HTMLElement
    let scriptElem = document.createElement("script")
    scriptElem.addEventListener("load", () => {
      console.log(`${scriptElem.src} loaded as script tag`)
      onloadCallback(scriptElem)
    })
    scriptElem.addEventListener("error", (err) => {
      console.log(`Error: injectScript: on loading file ${scriptElem.src}`, err)
      errorCallback(err)
    })
    scriptElem.setAttribute("type", type)
    scriptElem.setAttribute("src", src)
    injectParentElem.appendChild(scriptElem)
  } else {
    errorCallback(`Error: injectScript: parent element ${tag} is not exist as parent of inject`)
  }
}

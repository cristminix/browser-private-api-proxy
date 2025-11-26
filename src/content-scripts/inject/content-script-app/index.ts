import Logger from "../../../global/classes/Logger"
import App from "./ContentScriptApp.svelte"
import { attachRouteChangesEvent, createAppRootElement } from "../fn"
import { waitForElm } from "../../../global/fn/waitForElm"

const containerId = "extension-root"
const containerRootId = "content-script-root"
const appContainerId = "content-script-app"

let appInstance: App | undefined | null
let urlPath = ""
const displayWarning = () => {
  console.warn("On production this script must be running by injecting to the original source page ")
}
function getRootElement() {
  return document.getElementById(containerId)
}
export function cleanup() {
  const containerDivElement = getRootElement()
  if (containerDivElement) {
    Logger.debug(`Remove existing root element`)
    containerDivElement.remove()
  } else {
    displayWarning()
  }
}
export function initApp() {
  main()
}
const onValidCoursePage = () => {
  // const slug = getCourseSlugByPath(path)
  // console.log({ slug })

  // appInstance.setState({ validCoursePage, slug })
  if (appInstance && typeof appInstance.setValidCoursePage === "function" && typeof appInstance.setUrlPath === "function") {
    appInstance.setValidCoursePage(true)
    appInstance.setUrlPath(urlPath)
  }

  // pauseVideoPlayer()
}
const onInvalidCoursePage = () => {
  if (appInstance && typeof appInstance.setValidCoursePage === "function") appInstance.setValidCoursePage(false)
}
const main = async () => {
  attachRouteChangesEvent(async (path) => {
    urlPath = path
    console.log(appInstance, `URL changed to ${path}`)

    // const validCoursePage = isCoursePage()
    // if (!validCoursePage) {
    //   onInvalidCoursePage()
    //   waitForElm("div[data-avail-test]").then(() => {
    //     if (isCoursePage()) onValidCoursePage()
    //     else onInvalidCoursePage()
    //   })
    // } else {
    //   onValidCoursePage()
    // }
  })
  createAppRootElement(containerId, containerRootId)

  // Tambahkan delay kecil untuk memastikan DOM benar-benar siap
  setTimeout(() => {
    waitForElm(`#${containerRootId}`).then((el) => {
      if (el && el instanceof Element) {
        // Pastikan props tidak undefined
        const appProps = {
          containerId: appContainerId || "content-script-app",
        }

        try {
          // Pastikan App constructor dipanggil dengan benar
          appInstance = new App({
            target: el,
            props: appProps,
          })
        } catch (error) {
          console.error("Error creating App instance:", error)
          console.error("Props passed:", appProps)
        }
      } else {
        console.error("Failed to find element with id:", containerRootId, "Element:", el)
      }
    })
  }, 100)
}
// initApp()

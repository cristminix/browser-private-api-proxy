import Logger from "@/global/classes/Logger"
import App from "./ContentScriptApp.svelte"
import { attachRouteChangesEvent, createAppRootElement, getCourseSlugByPath } from "@/content-scripts/inject/fn"
import { waitForElm } from "@/global/fn/waitForElm"
import { isCoursePage } from "@/content-scripts/inject/fn/isCoursePage"
import { pauseVideoPlayer } from "@/content-scripts/inject/fn/pauseVideoPlayer"

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
  if (appInstance) {
    appInstance.setValidCoursePage(true)
    appInstance.setUrlPath(urlPath)
  }

  pauseVideoPlayer()
}
const onInvalidCoursePage = () => {
  if (appInstance) appInstance.setValidCoursePage(false)
}
const main = async () => {
  attachRouteChangesEvent(async (path) => {
    urlPath = path
    // console.log(appInstance, `URL changed to ${path}`)

    const validCoursePage = isCoursePage()
    if (!validCoursePage) {
      onInvalidCoursePage()
      waitForElm("div[data-avail-test]").then(() => {
        if (isCoursePage()) onValidCoursePage()
        else onInvalidCoursePage()
      })
    } else {
      onValidCoursePage()
    }
  })
  createAppRootElement(containerId, containerRootId)
  waitForElm(`#${containerRootId}`).then((el) => {
    appInstance = new App({
      props: {
        containerId: appContainerId,
      },

      target: el!,
    })
  })
}

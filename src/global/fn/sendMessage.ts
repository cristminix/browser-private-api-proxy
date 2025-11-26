import { MessageEvent } from "../classes/MessageEvent"
import type { SendMessageCallback } from "./types"

export const chromeSendMessage = (evt: ReturnType<typeof MessageEvent>, target: string, callback: SendMessageCallback) => {
  if (target === "content") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        const tab = tabs[0]
        chrome.tabs.sendMessage(tab.id as number, evt, (response) => {
          if (!chrome.runtime.lastError) {
            callback && callback(response)
          } else {
            callback && callback(response)
          }
        })
      }
    })
  } else {
    chrome.runtime.sendMessage(evt, (response) => {
      if (!chrome.runtime.lastError) {
        callback && callback(response)
      } else {
        callback && callback(response)
      }
    })
  }
}

export const sendMessage = async (eventName: string, data: any = null, target: "content" | "popup" = "content", callback: SendMessageCallback = (f) => f) => {
  const evt = MessageEvent(eventName, data)
  let success = true
  try {
    chromeSendMessage(evt, target, callback)
  } catch (err) {
    console.error(err)
    success = false
  }
  return success
}

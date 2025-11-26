import type { OnMessageCallback } from "./types"

export const onMessage = (callback: OnMessageCallback) => {
  try {
    chrome.runtime.onMessage.addListener((evt, sender) => {
      callback(evt, sender)
    })
  } catch (err) {
    console.log(err)
  }
}

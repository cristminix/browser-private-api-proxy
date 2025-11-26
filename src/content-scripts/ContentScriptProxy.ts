import { createRandCls } from "@/global/fn/createRandCls"
import { onMessage } from "@/global/fn/onMessage"
import type { InputScriptInterface, OutputScriptContentCallback } from "./types"
import { sendMessage } from "@/global/fn/sendMessage"
import { waitForElm } from "@/global/fn/waitForElm"
import type { MessageEventInterface } from "@/global/classes/types"

class ContentScriptProxy {
  constructor() {
    this.initController()
  }

  initController() {
    onMessage((evt: MessageEventInterface, sender) => {
      console.log(`ContentScriptProxy: receive message `, { evt, sender })
      switch (evt.name) {
        case "cmd.getCourseInfo":
          this.onCommand(evt.name)
          break
        case "cmd.addCourseLegacy":
          this.onCommand(evt.name, evt.data)
          break
        case "cmd.getCourseSections":
          this.onCommand(evt.name, evt.data)
          break
        case "cmd.getCourseToc":
          this.onCommand(evt.name, evt.data)
          break
        case "cmd.getCookie":
          this.onCommand(evt.name, evt.data)
          break
        case "cmd.isLogin":
          this.onCommand(evt.name, evt.data)
          break
        case "cmd.validCoursePage":
        case "cmd.validCoursePageAuto":
          this.onCommand(evt.name)
          break

        case "console.log":
          const data = evt.data as any[]
          data.map((item) => console.log(item))
          break

        default:
          this.onCommand(evt.name, evt.data)
          break
      }
      // console.log(evt, source);
    })

    this.waitForCheckerElm()
  }

  getExecuteBtn() {
    return document.getElementById("exec-button")
  }
  getInputScriptEl() {
    return document.getElementById("input-script")
  }
  getInputScriptCaller() {
    return document.getElementById("input-script-caller")
  }
  setInputScriptCaller(caller: string) {
    const elem = this.getInputScriptCaller() as HTMLTextAreaElement
    if (elem) {
      elem.value = caller
    }
  }
  getOutputScriptEl() {
    return document.getElementById("output-script")
  }
  setOutputScriptContent(value: string) {
    const elem = this.getOutputScriptEl() as HTMLTextAreaElement
    if (elem) {
      elem.value = value
    }
  }
  setInputScriptContent(is: InputScriptInterface) {
    const elem = this.getInputScriptEl() as HTMLTextAreaElement
    if (elem) {
      elem.value = JSON.stringify(is)
    }
  }

  executeScriptContent(is: InputScriptInterface, callback: OutputScriptContentCallback, caller = "popup") {
    try {
      if (!is.ocls) {
        is.ocls = createRandCls("os")
      }
      this.setInputScriptCaller(caller)
      this.setInputScriptContent(is)
      const executeBtnElem = this.getExecuteBtn() as HTMLButtonElement
      if (executeBtnElem) executeBtnElem.click()
      this.waitForScriptOutput(is.ocls, callback, caller)
    } catch (e) {
      console.error(e)
    }
  }
  async executeTopScript(cmd: string, param: any) {
    return new Promise((resolve, reject) => {
      const is = {
        ocls: createRandCls("os"),
        cmd,
        param,
      }
      const caller = "content"
      try {
        this.setInputScriptCaller(caller)
        this.setInputScriptContent(is)
        const executeBtnElem = this.getExecuteBtn() as HTMLButtonElement
        if (executeBtnElem) executeBtnElem.click()
        this.waitForScriptOutput(
          is.ocls,
          (result) => {
            resolve(result)
          },
          caller
        )
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }
  // callContentFn(is, callback, caller){
  //     try{
  //         this.setInputScriptContent(is)
  //         this.getExecuteBtn().click()
  //         this.waitForScriptOutput(is.ocls, callback, caller)
  //     }catch(e){
  //         // console.log(e)
  //     }
  // }
  lastSpanSelector: string = ""
  waitForScriptOutput(ocls: string, callback: OutputScriptContentCallback, caller = "popup") {
    this.lastSpanSelector = `span[data-test=${ocls}]`
    console.log(`waiting for span selector ${this.lastSpanSelector}`)

    waitForElm(this.lastSpanSelector).then((elm) => {
      console.log(`Found last span selector ${this.lastSpanSelector}`)
      const inputElem = this.getOutputScriptEl() as HTMLTextAreaElement
      const data = JSON.parse(inputElem.value)

      callback(data)

      elm.remove()
    })
  }
  // wait for valid course
  waitForCheckerElm() {
    waitForElm(".course-checker-last").then((el) => {
      if (el) {
        el.setAttribute("class", "_blank")
        setTimeout(() => {
          console.log(`valid course found, try to run cmd.validCoursePageAuto`)

          this.onCommand("cmd.validCoursePageAuto")
          this.waitForCheckerElm()
        }, 3000)
      }
    })
  }

  onCommand(command: string, param?: any) {
    const cmd = command.replace(/^cmd\./, "")
    const ocls = createRandCls("os")
    const is = {
      cmd,
      ocls,
      param,
    }
    console.log(`ContentScriptProxy.onCommand()`, { is })

    this.executeScriptContent(is, (data) => {
      // console.log(data)
      sendMessage(`${command}`, data, "popup")
    })
  }
}

export default ContentScriptProxy

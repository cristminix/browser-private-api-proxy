<script lang="ts">
  import { recursiveJSONStringify } from "@/global/fn/recursiveJSONStringify"
  import { hasMethod } from "@/global/fn/hasMethod"
  export let containerId: string

  import { writable } from "svelte/store"
  import { getCourseSlugByPath } from "../fn"
  import { topWindow } from "./TopWindow"
  import type { InputScriptInterface } from "@/content-scripts/types"

  import { createRandCls } from "@/global/fn/createRandCls"
  import { onDestroy, onMount } from "svelte"

  // converted from state
  export const validCoursePage = writable(false)
  export const slug = writable("")
  export const outputScriptCls = writable("default")
  export const inputScriptCaller = writable("")
  export const inputScriptDefaultValue = writable("")
  export const outputScript = writable("")
  export const ocls = writable("default")
  export const display = writable("flex")
  export const urlPath = writable("")

  export function setValidCoursePage(value: boolean) {
    validCoursePage.update((o) => value)
  }
  export function setUrlPath(value: string) {
    urlPath.update((o) => value)
  }

  let inputScriptEl: HTMLTextAreaElement
  let outputScriptEl: HTMLTextAreaElement

  // update slug on url path change
  urlPath.subscribe((value) => {
    slug.update((o) => getCourseSlugByPath(value))
  })

  export const runScript = async () => {
    let is: InputScriptInterface = {
      cmd: "getCourseInfo",
      param: null,
      ocls: createRandCls("os"),
    }
    const caller = inputScriptEl.value
    inputScriptCaller.update((o) => caller)

    console.log(`ContentInject.runScript()`, { is, caller })

    try {
      is = JSON.parse(inputScriptEl.value)
      // console.log(is)
      const method = is.cmd
      const param = is.param || null
      const ocls = is.ocls || "default"

      if (hasMethod(topWindow, method)) {
        // this.setState({ocls})
        console.log(`call topWindow.${method}(${param})`)
        const result = await topWindow[method](param)
        // console.log(result)
        outputScript.update((o) => new Date().getTime().toString())
        outputScriptCls.update((o) => ocls)
        try {
          outputScript.update((o) => recursiveJSONStringify(result))
          createSpanSelector(ocls)
          if ($outputScript.length / 1024 > 1000) {
            setTimeout(() => {
              outputScript.update((o) => `{cleared:'to save memory'}`)
            }, 15000)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        console.error(`ContentScriptApp doesnt have any method called ${method}`)
      }
      console.log(is)
    } catch (e) {
      console.error(e)
    }
  }
  const createSpanSelector = (data: string) => {
    const span = document.createElement("span")
    span.setAttribute("data-test", data)
    const parentElm = document.getElementById("span-container")
    if (parentElm) {
      parentElm.innerHTML = ""
      parentElm.appendChild(span)
    }
  }
  const handleExitButton = (e: Event) => {
    console.log(`handlerExitButton`, { e })
    // runScript()
    display.update((o) => "hidden")
  }
  const handleExecButton = (e: Event) => {
    console.log(`handlerExecButton`, { e })
    runScript()
  }
  const handleOnInputScriptCallerChange = (e: Event) => {
    console.log(`handleOnInputScriptCallerChange`, { e })
  }
  const handlerOnInputScriptChange = (e: Event) => {
    console.log(`handlerOnInputScriptChange`, { e })
  }

  onMount(()=>{
  })
/* Draggable Div*/
  export let left:number = 30
  export  let top:number=30
  let moving:boolean = false

  function startDrag(){
    moving = true
  }

  function stopDrag(){
    moving = false
  }

  function onMouseMove(e: MouseEvent) {
    // console.log(`move (${e.movementX}, ${e.movementY})`)
    if (moving) {
      left+= e.movementX
      top+= e.movementY
    }
  }
// $: console.log(moving)
  /* eof Draggable div*/
</script>
<svelte:window on:mouseup={stopDrag} on:mousemove={onMouseMove}/>
<div id={containerId} class="{$display} draggable" on:mousedown={startDrag} style="left:{left}px;top:{top}px">
  {#if $validCoursePage}
    <span>{$slug}</span>
  {:else}
    <span>Extension is ready</span>
  {/if}

  <textarea placeholder="Input script" id="input-script" bind:value={$inputScriptDefaultValue} bind:this={inputScriptEl} on:change={handlerOnInputScriptChange}></textarea>
  <textarea placeholder="Input script caller" id="input-script-caller" bind:value={$inputScriptCaller} on:change={handleOnInputScriptCallerChange}></textarea>
  <textarea placeholder="Output script" id="output-script" data-test={$outputScriptCls} bind:value={$outputScript} bind:this={outputScriptEl}></textarea>
  <div class="action-container">
    <div class="course-page-checker">
      {#if $validCoursePage}
        <span class="course-checker-last">This is a valid course page</span>
      {:else}
        <span class="course-checker">This is not a course page</span>
      {/if}
    </div>
    <div class="btn-container flex">
      <button id="exit-button" on:click={handleExitButton}> {" -"} Hide</button>
      <button id="exec-button" on:click={handleExecButton}> {" >"} Execute</button>
    </div>
    <span id="span-container"></span>
  </div>
</div>

<style>
  #input-script,
  #input-script-caller,
  #output-script {
    color: #000000;
    display: block;
    border: solid 1px #dddddd;
    margin-top: 3px;
    border-radius: 3px;
  }
  .flex {
    display: flex;
  }
  .hidden {
    display: none;
  }
  .draggable {
    position: absolute;
    z-index: 2001;
    border: solid 1px #dddddd;
    cursor: move;
    user-select: none;
    width: 450px !important;
    border-radius: 3px;
    /*
     margin-top: 3.1em;
    margin-left: 22%;
    */
  }
  #content-script-app {
    flex-direction: column;
    background: #000;
    color: #fff;
    opacity: 0.7;
    font-family: monospace;

    padding: 1em;
  }
  .action-container {
    width: 100%;
    /*text-align: right;*/
    display: flex;
    justify-content: space-between;
    padding-top: 4px;
  }
  .btn-container {
    align-items: end;
    justify-content: end;

  }
  .course-page-checker,
  .btn-container {
    padding: 2px;
    width: 50%;
  }
  #exit-button,
  #exec-button {
    border: solid 1px #dddddd;
    border-radius: 3px;
    cursor: pointer;
    margin-left: 2px;
    padding: 2px;
    background: #fff;
    color: #000;
  }
</style>

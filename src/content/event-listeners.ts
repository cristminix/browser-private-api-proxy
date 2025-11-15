// Function to set up event listeners using native DOM methods
export function triggerChangeEvent(chatInputElem: HTMLInputElement) {
  // Function to send event data to socket server
  const sendEventToServer = (event: Event, eventType: string) => {
    const eventData = {
      type: eventType,
      timestamp: Date.now(),
      targetElement: "chat-input",
      eventType: event.type,
      value: (event.target as HTMLInputElement)?.value || null,
      key: (event as KeyboardEvent).key || null,
      code: (event as KeyboardEvent).code || null,
      ctrlKey: (event as KeyboardEvent).ctrlKey || false,
      shiftKey: (event as KeyboardEvent).shiftKey || false,
      altKey: (event as KeyboardEvent).altKey || false,
      metaKey: (event as KeyboardEvent).metaKey || false,
    }
  }

  // Remove existing listeners to avoid duplicates if they exist
  const eventTypes = ["keydown", "keyup", "keypress", "input", "change"]
  eventTypes.forEach((eventType) => {
    const existingListener = (chatInputElem as any)[`_${eventType}Listener`]
    if (existingListener) {
      chatInputElem.removeEventListener(eventType, existingListener)
    }
  })

  // Add event listeners for the chat input element
  const keydownListener = (event: Event) => sendEventToServer(event, "keydown")
  const keyupListener = (event: Event) => sendEventToServer(event, "keyup")
  const keypressListener = (event: Event) =>
    sendEventToServer(event, "keypress")
  const inputListener = (event: Event) => sendEventToServer(event, "input")
  const changeListener = (event: Event) => sendEventToServer(event, "change")

  // Store references to the listeners so we can remove them later if needed
  ;(chatInputElem as any)._keydownListener = keydownListener
  ;(chatInputElem as any)._keyupListener = keyupListener
  ;(chatInputElem as any)._keypressListener = keypressListener
  ;(chatInputElem as any)._inputListener = inputListener
  ;(chatInputElem as any)._changeListener = changeListener

  chatInputElem.addEventListener("keydown", keydownListener, true)
  chatInputElem.addEventListener("keyup", keyupListener, true)
  chatInputElem.addEventListener("keypress", keypressListener, true)
  chatInputElem.addEventListener("input", inputListener, true)
  chatInputElem.addEventListener("change", changeListener, true)

  console.log(
    "Event listeners added to chat input element using native DOM methods"
  )
}

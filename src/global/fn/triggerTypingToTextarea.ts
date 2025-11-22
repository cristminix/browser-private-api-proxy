// Function to trigger keyboard and input events on an element
export function triggerTypingToTextarea(chatInputElem: HTMLTextAreaElement, text: string) {
  // Clear the textarea first
  chatInputElem.value = ""
  chatInputElem.focus()

  // Simulate a click event before typing (common human behavior)
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
  })
  chatInputElem.dispatchEvent(clickEvent)

  // Also simulate mousedown and mouseup events
  const mouseDownEvent = new MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    view: window,
  })
  chatInputElem.dispatchEvent(mouseDownEvent)

  const mouseUpEvent = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
    view: window,
  })
  chatInputElem.dispatchEvent(mouseUpEvent)

  // Type each character one by one with a small delay to simulate human typing
  typeTextWithDelay(chatInputElem, text, 0)
}

// Helper function to type text character by character
function typeTextWithDelay(element: HTMLTextAreaElement, text: string, index: number) {
  if (index >= text.length) {
    // All characters have been typed, trigger final change event
    triggerChangeEvent(element)

    // Resolve the promise if it exists
    const resolve = (element as any)._typingComplete
    if (resolve) {
      resolve()
      delete (element as any)._typingComplete
    }
    return
  }

  const char = text[index]

  // Simulate human typing with occasional pauses
  if (Math.random() < 0.05) {
    // 5% chance of a longer pause
    const pauseTime = 300 + Math.random() * 700 // 300-1000ms pause
    setTimeout(() => typeTextWithDelay(element, text, index), pauseTime)
    return
  }

  // Add the character to the textarea value
  element.value += char

  // Create and dispatch appropriate keyboard events for this character
  triggerKeyboardEvents(element, char)

  // Create and dispatch input event
  triggerInputEvent(element)

  // Calculate delay based on character type to simulate human typing
  // More realistic typing speeds with variations
  let delay = 80 + Math.random() * 120 // Base delay between 80-200ms

  // Different delays for different characters
  if (char === " ") {
    delay = 150 + Math.random() * 150 // Longer delay for spaces
  } else if ([".", ",", "!", "?", ";", ":"].includes(char)) {
    delay = 200 + Math.random() * 200 // Even longer delay for punctuation
  } else if (["\n", "\r"].includes(char)) {
    delay = 300 + Math.random() * 200 // Longer delay for newlines
  } else if (["a", "e", "i", "o", "u", " "].includes(char.toLowerCase())) {
    delay -= 20 // Slightly faster for common characters
  }

  // Continue with the next character after the delay
  setTimeout(() => typeTextWithDelay(element, text, index + 1), delay)
}

// Function to trigger keyboard events for a specific character
function triggerKeyboardEvents(element: HTMLTextAreaElement, char: string) {
  // Get proper key code information for more realistic simulation
  const keyCode = char.charCodeAt(0)
  let key = char
  let code = ""

  // Set proper key codes for special characters
  if (char === " ") {
    key = " "
    code = "Space"
  } else if (char === "\n") {
    key = "Enter"
    code = "Enter"
  } else if (char === "\t") {
    key = "Tab"
    code = "Tab"
  } else if (char.length === 1) {
    // Regular character
    code = `Key${char.toUpperCase()}`
  } else {
    // Fallback for any other case
    code = "Unknown"
  }

  // Create and dispatch keydown event with more realistic properties
  const keydownEvent = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode,
    ctrlKey: false,
    shiftKey: Math.random() < 0.1, // 10% chance of shift being pressed
    altKey: Math.random() < 0.05, // 5% chance of alt being pressed
    metaKey: false,
    repeat: false,
    location: 0,
  })
  element.dispatchEvent(keydownEvent)

  // Create and dispatch keypress event
  const keypressEvent = new KeyboardEvent("keypress", {
    bubbles: true,
    cancelable: true,
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode,
    ctrlKey: false,
    shiftKey: Math.random() < 0.1,
    altKey: Math.random() < 0.05,
    metaKey: false,
    repeat: false,
    location: 0,
  })
  element.dispatchEvent(keypressEvent)

  // Create and dispatch keyup event
  const keyupEvent = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode,
    ctrlKey: false,
    shiftKey: Math.random() < 0.1,
    altKey: Math.random() < 0.05,
    metaKey: false,
    repeat: false,
    location: 0,
  })
  element.dispatchEvent(keyupEvent)
}

// Function to trigger input event with more realistic properties
function triggerInputEvent(element: HTMLTextAreaElement) {
  // Try multiple input event types to ensure compatibility
  const inputEvent1 = new InputEvent("input", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: null,
    isComposing: false,
  })
  element.dispatchEvent(inputEvent1)

  // Also try a standard Event as fallback
  const inputEvent2 = new Event("input", {
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(inputEvent2)

  // Try a custom event as well
  const customEvent = new CustomEvent("input", {
    bubbles: true,
    cancelable: true,
    detail: {
      inputType: "insertText",
      data: null,
      isComposing: false,
    },
  })
  element.dispatchEvent(customEvent)
}

// Function to trigger final change event
export function triggerChangeEvent(element: HTMLTextAreaElement | HTMLInputElement) {
  // Force a blur and focus cycle to ensure change detection
  element.blur()
  element.focus()

  // Try multiple change event types
  const changeEvent1 = new Event("change", {
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(changeEvent1)

  // Also try a custom event
  const customChangeEvent = new CustomEvent("change", {
    bubbles: true,
    cancelable: true,
    detail: { source: "triggerTypingToTextarea" },
  })
  element.dispatchEvent(customChangeEvent)

  // Trigger a blur event as well
  const blurEvent = new Event("blur", {
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(blurEvent)

  // And a focus event
  const focusEvent = new Event("focus", {
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(focusEvent)
}

// Function to trigger keyboard and input events on an element
export function triggerChangeEvent(chatInputElem: HTMLInputElement) {
  // Create and dispatch keyboard events
  const eventTypes = ["keydown", "keyup", "keypress", "input", "change"]

  eventTypes.forEach((eventType) => {
    let event: Event;

    if (["keydown", "keyup", "keypress"].includes(eventType)) {
      // Create keyboard events with some default properties
      event = new KeyboardEvent(eventType, {
        bubbles: true,
        cancelable: true,
        key: "",
        code: "",
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false
      });
    } else {
      // Create input and change events
      event = new Event(eventType, {
        bubbles: true,
        cancelable: true
      });
    }

    // Dispatch the event on the element
    chatInputElem.dispatchEvent(event);
    console.log(`"${eventType}" event triggered on chat input element`);
  });

  console.log("All events have been triggered on the chat input element");
}

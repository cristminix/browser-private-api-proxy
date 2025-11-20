// Create and inject the fetch interceptor using web accessible resources
try {
  // Create a script element that references the web accessible resource
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("src/content/dist/fetch-injector.js")

  // Add to the page
  ;(document.head || document.documentElement).appendChild(script)

  console.log("[CRXJS] Fetch interceptor injected into page DOM via web accessible resource")
} catch (error) {
  console.error("[CRXJS] Error injecting fetch-interceptor script:", error)
}

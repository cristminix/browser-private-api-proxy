export async function streamToResponse(response: Response) {
  let responseLines = []
  if (response.ok) {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          //   handleStreamCompletion(state, options)
          break
        }

        // Decode the chunk and add to buffer
        buffer = decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")

        // Keep the last incomplete part in buffer
        buffer = lines.pop() || ""

        // Process each complete line
        for (const line of lines) {
          //   await processLine(line, state, options)
          if (!line.trim() || line === "data: [DONE]") {
            return
          }
          responseLines.push(line)
          console.log({ line })
        }
      }
    } finally {
      // Ensure reader is released even if an error occurs
      reader.releaseLock()
    }
  }
  return JSON.stringify(responseLines)
}

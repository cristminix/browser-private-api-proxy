const getOriginalFetchOptions = (...args: [any, any]) => {
  const [resource, init] = args
  const options = {
    url: typeof resource === "string" ? resource : (resource as any).url || resource,
    method: init?.method || "GET",
    headers: init?.headers,
    body: init?.body,
  }
  return options
}

// Define types for the fake response
interface FakeResponseOptions {
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: string | object
  url?: string
}

const createFakeFetchResponse = (url: string, options: FakeResponseOptions = {}) => {
  const { status = 200, statusText = "OK", headers = { "content-type": "application/json" }, body = { message: "This is a fake response" } } = options

  // Convert body to string if it's an object
  const bodyText = typeof body === "string" ? body : JSON.stringify(body)

  // Create a mock Response object
  const mockResponse: Partial<Response> = {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
      forEach: (callback: (value: string, name: string) => void) => {
        Object.entries(headers).forEach(([name, value]) => callback(value, name))
      },
      // Add other headers methods as needed
    } as Headers,
    url,
    text: async () => bodyText,
    json: async () => JSON.parse(bodyText),
    blob: async () => new Blob([bodyText], { type: headers["content-type"] || "application/json" }),
    arrayBuffer: async () => {
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(bodyText)
      // Create ArrayBuffer from Uint8Array
      const arrayBuffer = uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength)
      return arrayBuffer
    },
    clone: () => createFakeFetchResponse(url, { status, statusText, headers, body }),
  }

  return mockResponse as Response
}

// Example usage:
// const fakeResponse = createFakeResponse('https://api.example.com/data', {
//   status: 200,
//   statusText: 'OK',
//   headers: { 'content-type': 'application/json' },
//   body: { data: 'example data', success: true }
// })
//
// fakeResponse.json().then(data => console.log(data)) // { data: 'example data', success: true }
// fakeResponse.text().then(text => console.log(text)) // '{"data":"example data","success":true}'

export { createFakeFetchResponse }

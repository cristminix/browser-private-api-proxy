// Gunakan window untuk mengakses environment variable karena import.meta tidak didukung dalam format iife
const getDebugMode = (): boolean => {
  if (typeof window !== "undefined" && window) {
    const win = window as any
    if (win["VITE_DEBUG_MODE"]) {
      return win["VITE_DEBUG_MODE"] === "true"
    }
  }
  // Fallback ke environment variable global atau false
  const globalAny = globalThis as any
  return globalAny["VITE_DEBUG_MODE"] === "true" || false
}

const DEBUG_MODE = getDebugMode()

export default class Logger {
  static debug(...data: any[]) {
    if (DEBUG_MODE) console.log.apply(this, data)
  }

  static info(...data: any[]) {
    console.info(data)
  }

  static warn(...data: any[]) {
    console.warn(data)
  }

  static error(...data: any[]) {
    console.error(data)
  }
}

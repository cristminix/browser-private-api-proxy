const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === "true"

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

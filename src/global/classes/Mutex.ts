/**
 * Simple Mutex implementation for managing concurrent access to shared resources
 */
export class Mutex {
  private _locked = false
  private _waiters: Array<() => void> = []

  /**
   * Acquire the mutex lock
   * @returns Promise that resolves when the lock is acquired
   */
  async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this._locked) {
        this._locked = true
        resolve()
      } else {
        this._waiters.push(resolve)
      }
    })
  }

  /**
   * Release the mutex lock
   */
  release(): void {
    if (this._waiters.length > 0) {
      const next = this._waiters.shift()
      if (next) next()
    } else {
      this._locked = false
    }
  }

  /**
   * Execute a function within a mutex lock
   * @param fn - Function to execute while holding the lock
   * @returns Promise with the result of the function
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

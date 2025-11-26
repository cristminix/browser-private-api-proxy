export interface InputScriptInterface {
  cmd: string
  ocls?: string
  param?: any
}

export type OutputScriptContentCallback = (data: any) => void

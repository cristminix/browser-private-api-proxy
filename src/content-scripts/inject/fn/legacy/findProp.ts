export const findProp = (key: string, src: any) => {
  const regexObj = new RegExp("^" + key, "g")
  for (let k in src) {
    if (k.match(regexObj)) {
      return src[k]
    }
  }
  return null
}

export const findPropLegacy = (key: string, src: any, recursive: number | boolean = false) => {
  if (!key || !src) {
    return null
  }
  // if(!src){
  //     return null
  // }
  const regexObj = new RegExp("^" + key, "g")
  const keys = Object.keys(src)
  for (const k of keys) {
    // console.log(`${k} == ${key}`)
    const row = src[k]
    if (k.match(regexObj)) {
      return row
    } else {
      if (recursive) {
        if (typeof row === "object" && row !== null) {
          const result = findPropLegacy(key, row, recursive) as any
          if (result) {
            return result
          }
        }
      }
    }
  }
  return null
}

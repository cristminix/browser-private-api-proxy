export const getM3RecByType = (type: string, m3Rec: any) => {
  let results = []
  const keys = Object.keys(m3Rec)
  for (const key of keys) {
    const item = m3Rec[key]
    if (item.__data) {
      if (item.__data.$type) {
        if (item.__data.$type == type) {
          results.push(item.__data)
        }
      }
    }
  }
  return results
}

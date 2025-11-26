export function createRandCls(prefix = "os") {
  const dtStr = new Date().getTime().toString()
  return `${prefix}-${dtStr}`
}

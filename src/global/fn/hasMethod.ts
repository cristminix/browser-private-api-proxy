export function hasMethod<T extends object>(
  obj: T,
  methodName: string,
): obj is T & Record<typeof methodName, (...args: any[]) => any> {
  if (methodName in obj && typeof obj[methodName as keyof T] === "function") {
    return true;
  }
  return false;
}

// findBpr(
// '$type',
// 'com.linkedin.learning.api.deco.content.ExerciseFile',
// bprStore,
// ['sizeInBytes','name','url'],
// false)
interface IRegularObject {
  [key: string]: string | IRegularObject | null;
}

export function lookupDataStore(
  key: string,
  value: string,
  source: IRegularObject,
  props: string[],
  list: any,
) {
  list = typeof list === "undefined" ? false : list;
  let lists: any[] = [];
  for (let i in source) {
    const obj: any = source[i];
    if ("undefined" !== typeof obj[key]) {
      if (obj[key] === value) {
        let rets: IRegularObject = {};
        for (let j in props) {
          const prop = props[j];
          if ("undefined" !== typeof obj[prop]) {
            rets[prop] = obj[prop];
          } else {
            rets[prop] = null;
          }
        }
        if (!list) {
          return rets;
        } else {
          lists.push(rets);
        }
      }
    }
  }
  return lists;
}

interface TEmberWindow {
  requireModule?: (moduleName: string) => any;
  Ember?: any;
}
type TTopWindow = TEmberWindow & Window;
const topWIndow: TTopWindow = window;

export function getM3Rec() {
  let Ember: any;
  try {
    // @ts-ignore
    Ember = topWIndow.requireModule("ember")["default"];
  } catch {
    Ember = topWIndow.Ember;
  }
  try {
    let app = Ember.Namespace.NAMESPACES.find(
      (namespace: any) => namespace instanceof Ember.Application,
    );
    let store = app.__container__.lookup("service:store");
    return store._globalM3RecordDataCache;
  } catch (e) {}
  return null;
}

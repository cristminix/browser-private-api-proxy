import { ActivePageScriptRunner as runner } from "./inject";

window.onload = () => {
  runner.cleanup().run();
};

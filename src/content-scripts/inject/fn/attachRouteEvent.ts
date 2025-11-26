import { type RouteChangesCallback } from "./types";
const DEFAULT_BASE_URL = "https://www.linkedin.com/learning";

export const attachRouteChangesEvent = (
  callback: RouteChangesCallback,
  baseUrl = DEFAULT_BASE_URL,
): void => {
  let previousUrl = "";

  let observer = new MutationObserver(function (mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      const path = location.href.replace(baseUrl, "");
      callback(path);
    }
  });

  const config = { subtree: true, childList: true };
  observer.observe(document, config);
};

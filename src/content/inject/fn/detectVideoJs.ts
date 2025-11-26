import type { OnElementFoundCallback } from "@/content-scripts/inject/fn/types";
import { waitForElm } from "@/global/fn/waitForElm";

export const detectVideoJs = (callback: OnElementFoundCallback) => {
  waitForElm(".video-js").then((elm): void => {
    callback(elm);
  });
};

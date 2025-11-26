import { detectVideoJs } from "@/content-scripts/inject/fn/detectVideoJs";

export const pauseVideoPlayer = (timeout = 5000) => {
  detectVideoJs(() => {
    setTimeout(() => {
      const videoElem = document.querySelector("video");
      if (videoElem) videoElem.pause();
    }, timeout);
  });
};

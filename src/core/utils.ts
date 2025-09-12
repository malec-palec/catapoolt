// https://github.com/eliasku/13/blob/master/packages/client/src/utils/raf.ts
export const setupRAF = (callback: (now: DOMHighResTimeStamp) => void): void => {
  let then = performance.now();
  const animateLoop = (now: DOMHighResTimeStamp, frameRateCap = 60) => {
    requestAnimationFrame(animateLoop);
    const delta = now - then;
    const tolerance = 0.1;
    const interval = 1000 / frameRateCap;
    if (delta >= interval - tolerance) {
      then = now - (delta % interval);
      callback(now);
    }
  };
  requestAnimationFrame(animateLoop);
};

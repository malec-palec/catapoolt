import { music, sfx } from "../../tunes.js";
import "./player.min.js";

export const enum Sounds {
  Beep = 19,
  Stretching = 20,
  ReleaseWobble = 21,
  Poop = 22,
  Smacking = 23,
  Landing = 25,
}

const pico8 = new Pico8(sfx, music);

let curTrack: Pico8AudioSource | null = null;
let globalVolume: number = 1;
let globalGainNode: GainNode | null = null;

export const playSound = (index: number): void => {
  pico8.sfx(index);
};

export const playMusic = (trackNo: number = 0): void => {
  stopMusic();

  // setup gain node
  const audioContext = pico8.audioCtx();
  if (!globalGainNode) {
    // Create gain node and replace the audio context destination
    globalGainNode = audioContext.createGain();
    globalGainNode.connect(audioContext.destination);
    globalGainNode.gain.value = globalVolume;

    // Override the destination property to route through our gain node
    const originalDestination = audioContext.destination;
    Object.defineProperty(audioContext, "destination", {
      get: () => globalGainNode || originalDestination,
      configurable: true,
    });
  }

  curTrack = pico8.music(trackNo);
};

export const stopMusic = (): void => {
  if (curTrack) {
    curTrack.stop();
    curTrack = null;
  }
};

export const setGlobalVolume = (volume: number): void => {
  globalVolume = Math.max(0, Math.min(1, volume));
  updateGainNodeVolume();
};

export const getGlobalVolume = (): number => {
  return globalVolume;
};

export const toggleMute = (): boolean => {
  globalVolume = globalVolume === 0 ? 1 : 0;
  updateGainNodeVolume();
  return globalVolume === 0; // Return true if muted
};

const updateGainNodeVolume = (): void => {
  if (globalGainNode) {
    globalGainNode.gain.value = globalVolume;
  }
};

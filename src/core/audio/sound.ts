import { music, sfx } from "../../tunes.js";
import "./player.min.js";

export const enum Sound {
  Beep = 19,
  Stretching = 20,
  ReleaseWobble = 21,
  Poop = 22,
  Smacking = 23,
  Landing = 25,
}

const pico8 = new Pico8(sfx, music);
const { audioCtx } = pico8;

let curTrack: Pico8AudioSource | null = null;
export let globalVolume: number = 1;

// setup gain node
// Create gain node and replace the audio context destination
const globalGainNode = audioCtx.createGain();
globalGainNode.connect(audioCtx.destination);
globalGainNode.gain.value = globalVolume;

// Override the destination property to route through our gain node
const originalDestination = audioCtx.destination;
Object.defineProperty(audioCtx, "destination", {
  get: () => globalGainNode || originalDestination,
  configurable: true,
});

export const playSound = (index: number): void => {
  pico8.sfx(index);
};

export const playMusic = (trackNo: number = 0): void => {
  stopMusic();
  curTrack = pico8.music(trackNo);
};

export const stopMusic = (): void => {
  if (curTrack) {
    curTrack.stop();
    curTrack = null;
  }
};

export const toggleMute = (): boolean => {
  globalVolume = globalVolume === 0 ? 1 : 0;
  globalGainNode.gain.value = globalVolume;
  return globalVolume === 0; // Return true if muted
};

export const unlockAudio = (): false | Promise<void> => audioCtx.state[0] === "s" && audioCtx.resume();

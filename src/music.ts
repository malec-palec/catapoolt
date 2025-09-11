import "./core/audio/player.min.js";
import { music, sfx } from "./tunes";

const pico8 = new Pico8(sfx, music);

let curTrack: Pico8AudioSource | null = null;

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

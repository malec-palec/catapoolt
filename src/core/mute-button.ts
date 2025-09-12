import { getGlobalVolume, toggleMute } from "./audio/sound";
import { Button } from "./button";

export class MuteButton extends Button {
  private isMuted: boolean = false;

  constructor({
    width,
    height = width,
    x = 0,
    y = x,
    fontSize = 16,
  }: {
    width: number;
    height?: number;
    x?: number;
    y?: number;
    fontSize?: number;
  }) {
    super({
      width,
      height,
      x,
      y,
      text: "🔊", // Default to sound on icon
      clickHandler: () => {
        this.isMuted = toggleMute();
        this.updateButtonText();
      },
      fontSize,
    });

    this.isMuted = getGlobalVolume() === 0;
    this.updateButtonText();
  }

  private updateButtonText(): void {
    this.text = this.isMuted ? "🔇" : "🔊";
  }
}

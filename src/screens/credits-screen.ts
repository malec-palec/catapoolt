import { BaseScreen } from "../base-screen";
import { Button } from "../core/button";
import { Text } from "../core/text";
import { IGame } from "../game";
import { StartScreen } from "./start-screen";
export class CreditsScreen extends BaseScreen {
  private title: Text;
  private lines: Text[];

  constructor(game: IGame) {
    super(game);

    this.title = new Text("Credits", 64, "Arial", "bold");

    this.lines = [
      new Text("Development by Gleb V.", 32),
      new Text("Cover art by Alisa A.", 32),
      new Text("Sound design by Katie S.", 32),
    ];

    const backButton = new Button({
      width: 60,
      x: 20,
      text: "✖",
      fontSize: 32,
      clickHandler: () => this.game.changeScreen(StartScreen),
    });

    this.add(this.title, ...this.lines, backButton);
  }

  override doResize(): void {
    const { title, lines } = this;
    title.setPos(c.width / 2, c.height / 3);

    const centerY = c.height / 2;
    const lineSpacing = 50;

    lines[0].setPos(c.width / 2, centerY - lineSpacing);
    lines[1].setPos(c.width / 2, centerY);
    lines[2].setPos(c.width / 2, centerY + lineSpacing);
  }
}

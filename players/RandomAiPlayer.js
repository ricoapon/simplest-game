import { Player } from "./Player.js";

export class RandomAiPlayer extends Player {
  constructor() {
    super("Random AI", false);
  }

  chooseMove() {
    return Math.random() < 0.5 ? "X" : "O";
  }
}

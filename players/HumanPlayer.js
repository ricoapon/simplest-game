import { Player } from "./Player.js";

// Human players are driven by the UI, so chooseMove returns null.
export class HumanPlayer extends Player {
  constructor() {
    super("Human", true);
  }
}

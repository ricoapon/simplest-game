import { HumanPlayer } from "./HumanPlayer.js";
import { RandomAiPlayer } from "./RandomAiPlayer.js";
import { PerfectAiPlayer } from "./PerfectAiPlayer.js";

export function createPlayer(mode) {
  if (mode === "perfect") return new PerfectAiPlayer();
  if (mode === "random") return new RandomAiPlayer();
  return new HumanPlayer();
}

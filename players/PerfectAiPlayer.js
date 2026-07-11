import { Player } from "./Player.js";
import { Result } from "../Game.js";

// Bounded so large pattern sizes can't hang the tab. Alpha-beta pruning + the
// memoized regexes in Game keep each node cheap, but the tree is still
// exponential, so depth is the real limit. 20 is tuned to the browser: worst
// case ~160ms in-browser; going deeper stalls large-pattern configs (~1s at 24).
const MAX_DEPTH = 20;

export class PerfectAiPlayer extends Player {
  constructor() {
    super("Perfect AI", false);
  }

  // Optimal move for whoever's turn it is. Falls back to random when the tree
  // is too deep to resolve within MAX_DEPTH.
  chooseMove(game) {
    const meIsPlayer1 = game.isPlayer1Turn;
    let best = null;
    let bestScore = -Infinity;
    for (const mark of ["X", "O"]) {
      const score = this.#search(game.clone().makeMove(mark), meIsPlayer1, 1, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        best = mark;
      }
    }
    return best !== null ? best : (Math.random() < 0.5 ? "X" : "O");
  }

  // Minimax with alpha-beta pruning. `alpha` is the best score the maximizer is
  // already assured of; `beta` the best the minimizer is assured of. Once they
  // cross, the remaining sibling moves can't affect the result, so we cut off.
  #search(game, meIsPlayer1, depth, alpha, beta) {
    const r = game.result();
    if (r !== Result.NOT_FINISHED) return this.#terminalScore(r, meIsPlayer1);
    if (depth >= MAX_DEPTH) return 0; // guard: give up, treat as neutral

    const maximizing = game.isPlayer1Turn === meIsPlayer1;
    let best = maximizing ? -Infinity : Infinity;
    for (const mark of ["X", "O"]) {
      const s = this.#search(game.clone().makeMove(mark), meIsPlayer1, depth + 1, alpha, beta);
      if (maximizing) {
        best = Math.max(best, s);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, s);
        beta = Math.min(beta, best);
      }
      if (beta <= alpha) break; // the other player would never allow this branch
    }
    return best;
  }

  #terminalScore(result, meIsPlayer1) {
    if (result === Result.PLAYER_1_WIN) return meIsPlayer1 ? 1 : -1;
    if (result === Result.PLAYER_2_WIN) return meIsPlayer1 ? -1 : 1;
    return 0; // DRAW
  }
}

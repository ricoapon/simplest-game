import { Player } from "./Player.js";
import { Result } from "../Game.js";
import { OPENING_BOOK, OPENING_BOOK_CONFIG } from "./openingBook.js";

// Bounded so large pattern sizes can't hang the tab. Alpha-beta pruning + the
// memoized regexes in Game keep each node cheap, but the tree is still
// exponential, so depth is the real limit. 20 is tuned to the browser: worst
// case ~160ms in-browser; going deeper stalls large-pattern configs (~1s at 24).
export const MAX_DEPTH = 20;

// True when `cfg` uses exactly the win rules the opening book was generated for.
function configMatchesBook(cfg) {
  return cfg.p1Length === OPENING_BOOK_CONFIG.p1Length
    && cfg.p1Repeats === OPENING_BOOK_CONFIG.p1Repeats
    && cfg.p2Length === OPENING_BOOK_CONFIG.p2Length
    && cfg.p2Repeats === OPENING_BOOK_CONFIG.p2Repeats;
}

export class PerfectAiPlayer extends Player {
  constructor() {
    super("Perfect AI", false);
  }

  // Set by chooseMove: true when the last move could NOT be proven optimal (the
  // search hit MAX_DEPTH) and was therefore picked at random. The UI reads this
  // to warn that the "perfect" AI wasn't perfect this turn.
  lastMoveWasRandom = false;

  // Set during a search when the depth guard fires; if it stays false the tree
  // was fully resolved to real terminals, so the chosen move is provably optimal.
  #hitDepthCap = false;

  // Optimal move for whoever's turn it is.
  //   1. Opening book (default rules only): the early game is too deep for the
  //      depth-capped search to resolve, so we replay a precomputed perfect move.
  //   2. Otherwise: minimax with alpha-beta pruning. A +1/-1 result is a proven
  //      forced win/loss and is trusted. A 0 is trusted only if the search never
  //      hit the depth cap; if it did, the outcome is genuinely unknown, so we
  //      pick a move at random and flag it (lastMoveWasRandom) for the UI to warn.
  chooseMove(game) {
    this.lastMoveWasRandom = false;

    const bookMove = this.#bookMove(game);
    if (bookMove !== null) return bookMove;

    const meIsPlayer1 = game.isPlayer1Turn;
    let best = null;
    let bestScore = -Infinity;
    let bestTruncated = true;
    for (const mark of ["X", "O"]) {
      this.#hitDepthCap = false;
      const score = this.#search(game.clone().makeMove(mark), meIsPlayer1, 1, -Infinity, Infinity);
      const truncated = this.#hitDepthCap;
      // Prefer a higher score; break ties toward a fully-resolved (non-truncated)
      // line so a real draw is chosen over an unknown that merely scored 0.
      if (score > bestScore || (score === bestScore && bestTruncated && !truncated)) {
        bestScore = score;
        best = mark;
        bestTruncated = truncated;
      }
    }

    // A win/loss (±1) rides on real terminals, so it's provably correct even if
    // the cap fired on some other branch. Only an ambiguous 0 that leaned on the
    // depth cap is untrustworthy — own it: choose randomly and let the UI say so.
    const reliable = best !== null && (bestScore !== 0 || !bestTruncated);
    if (!reliable) {
      this.lastMoveWasRandom = true;
      return Math.random() < 0.5 ? "X" : "O";
    }
    return best;
  }

  // The precomputed optimal move for this exact state, or null if the config
  // doesn't match the book or the state is past the book's coverage.
  #bookMove(game) {
    if (!configMatchesBook(game.cfg)) return null;
    const move = OPENING_BOOK[game.state];
    return move === undefined ? null : move;
  }

  // Minimax with alpha-beta pruning. `alpha` is the best score the maximizer is
  // already assured of; `beta` the best the minimizer is assured of. Once they
  // cross, the remaining sibling moves can't affect the result, so we cut off.
  #search(game, meIsPlayer1, depth, alpha, beta) {
    const r = game.result();
    if (r !== Result.NOT_FINISHED) return this.#terminalScore(r, meIsPlayer1);
    if (depth >= MAX_DEPTH) { this.#hitDepthCap = true; return 0; } // guard: give up

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

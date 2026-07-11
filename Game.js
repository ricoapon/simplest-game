// The Simplest Game — all core game state and rules in one place.
// Players alternate appending a mark ("X" or "O") to one shared string; after
// each move both win rules are tested against the string:
//   - only one rule matches            -> that player wins
//   - both match at once                -> DRAW
//   - neither, and we hit the move cap  -> DRAW (safeguard for pathological rules)
//   - otherwise                         -> NOT_FINISHED

export const Result = {
  NOT_FINISHED: "NOT_FINISHED",
  PLAYER_1_WIN: "PLAYER_1_WIN",
  PLAYER_2_WIN: "PLAYER_2_WIN",
  DRAW: "DRAW",
};

export const DEFAULTS = { p1Length: 5, p1Repeats: 2, p2Length: 3, p2Repeats: 4 };

// If no pattern ever forms, declare a draw once the string reaches this length.
export const MAX_MOVES = 100;

// A win rule: a pattern of `length` chars that repeats `repeats` times anywhere.
//   winRegex(5, 2) -> (.{5}).*\1          winRegex(3, 4) -> (.{3}).*\1.*\1.*\1
// Memoized: result() runs on every minimax node, so we compile each distinct
// (length, repeats) regex once and reuse it. A non-global RegExp keeps no state
// across .test() calls, so sharing one instance across the search is safe.
const reCache = new Map();
function winRegex(length, repeats) {
  const key = length + ":" + repeats;
  let re = reCache.get(key);
  if (re === undefined) {
    const backref = ".*\\1".repeat(Math.max(0, repeats - 1));
    re = new RegExp("(.{" + length + "})" + backref);
    reCache.set(key, re);
  }
  return re;
}

export class Game {
  constructor(cfg) {
    this.cfg = Object.assign({}, DEFAULTS, cfg || {});
    this.state = "";
    this.isPlayer1Turn = true; // player 1 moves first
  }

  makeMove(mark) {
    if (mark !== "X" && mark !== "O") {
      throw new Error("You have to place X or O");
    }
    this.state += mark;
    this.isPlayer1Turn = !this.isPlayer1Turn;
    return this;
  }

  result() {
    const p1 = winRegex(this.cfg.p1Length, this.cfg.p1Repeats).test(this.state);
    const p2 = winRegex(this.cfg.p2Length, this.cfg.p2Repeats).test(this.state);
    if (p1 && p2) return Result.DRAW;
    if (p1) return Result.PLAYER_1_WIN;
    if (p2) return Result.PLAYER_2_WIN;
    if (this.state.length >= MAX_MOVES) return Result.DRAW;
    return Result.NOT_FINISHED;
  }

  clone() {
    const g = new Game(this.cfg);
    g.state = this.state;
    g.isPlayer1Turn = this.isPlayer1Turn;
    return g;
  }

  // Map of cell index -> occurrence number (0, 1, 2, ...) for the repeats that
  // make up the winning pattern. Only the pattern cells are included, never the
  // gaps between them, so the UI can alternate colors per occurrence.
  // Empty when there is no winner.
  winningCells() {
    const res = this.result();
    let length, repeats;
    if (res === Result.PLAYER_1_WIN) { length = this.cfg.p1Length; repeats = this.cfg.p1Repeats; }
    else if (res === Result.PLAYER_2_WIN) { length = this.cfg.p2Length; repeats = this.cfg.p2Repeats; }
    else return new Map();

    // Capture the first occurrence plus each (gap, occurrence) pair after it, so
    // we can recover the absolute index of every pattern occurrence. Lazy gaps
    // pick the tightest set of repeats, which reads most clearly when highlighted.
    const tail = "(.*?)(\\1)".repeat(Math.max(0, repeats - 1));
    const re = new RegExp("(.{" + length + "})" + tail);
    const m = re.exec(this.state);
    const cells = new Map();
    if (!m) return cells;

    let pos = m.index;
    let occ = 0;
    const mark = (start) => { for (let i = 0; i < length; i++) cells.set(start + i, occ); };
    mark(pos);          // group 1: first occurrence
    pos += length;
    occ++;
    // Remaining groups arrive in (gap, occurrence) pairs: m[2],m[3], m[4],m[5], ...
    for (let g = 2; g < m.length; g += 2) {
      pos += (m[g] || "").length; // skip the gap
      mark(pos);
      pos += length;
      occ++;
    }
    return cells;
  }
}

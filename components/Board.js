import { html } from "../lib/html.js";

// Renders the game string as X/O tiles, highlighting the winning pattern.
// Each occurrence of the pattern gets an alternating highlight color so the
// repeats stand out at a glance.
export function Board({ game }) {
  const wins = game.winningCells();
  const marks = [...game.state];
  const cls = (mark, i) => {
    if (!wins.has(i)) return "cell " + mark;
    return "cell " + mark + " win win-" + (wins.get(i) % 2);
  };
  return html`
    <div className="board" aria-label="game string">
      ${marks.map((mark, i) => html`<div key=${i} className=${cls(mark, i)}>${mark}</div>`)}
    </div>`;
}

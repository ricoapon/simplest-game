import { useState } from "react";
import { html } from "../lib/html.js";
import { DEFAULTS } from "../Game.js";

function clampInt(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

// Config inputs + per-player mode selectors + Start. Local state until Start,
// then hands the chosen config and modes up to <App> via onStart.
export function Setup({ onStart }) {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [p1Mode, setP1Mode] = useState("human");
  const [p2Mode, setP2Mode] = useState("perfect");

  const num = (key) => (e) => setCfg({ ...cfg, [key]: e.target.value });

  function start() {
    onStart(
      {
        p1Length: clampInt(cfg.p1Length, 1, 20, 5),
        p1Repeats: clampInt(cfg.p1Repeats, 2, 10, 2),
        p2Length: clampInt(cfg.p2Length, 1, 20, 3),
        p2Repeats: clampInt(cfg.p2Repeats, 2, 10, 4)
      },
      p1Mode,
      p2Mode
    );
  }

  return html`
    <div>
      <fieldset className="rules">
        <legend>Win rules</legend>
        <div className="grid">
          <label>P1 pattern length
            <input type="number" min="1" max="20" value=${cfg.p1Length} onChange=${num("p1Length")} />
          </label>
          <label>P1 repeats
            <input type="number" min="2" max="10" value=${cfg.p1Repeats} onChange=${num("p1Repeats")} />
          </label>
          <label>P2 pattern length
            <input type="number" min="1" max="20" value=${cfg.p2Length} onChange=${num("p2Length")} />
          </label>
          <label>P2 repeats
            <input type="number" min="2" max="10" value=${cfg.p2Repeats} onChange=${num("p2Repeats")} />
          </label>
        </div>
      </fieldset>

      <fieldset className="players">
        <legend>Players</legend>
        <div className="grid">
          <label>Player 1
            <select value=${p1Mode} onChange=${(e) => setP1Mode(e.target.value)}>
              <option value="human">Human</option>
              <option value="random">Random AI</option>
              <option value="perfect">Perfect AI</option>
            </select>
          </label>
          <label>Player 2
            <select value=${p2Mode} onChange=${(e) => setP2Mode(e.target.value)}>
              <option value="human">Human</option>
              <option value="random">Random AI</option>
              <option value="perfect">Perfect AI</option>
            </select>
          </label>
        </div>
      </fieldset>

      <button className="btn primary" onClick=${start}>Start game</button>
    </div>`;
}

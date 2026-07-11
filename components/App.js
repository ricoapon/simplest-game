import { useState, useEffect } from "react";
import { html } from "../lib/html.js";
import { Game, Result } from "../Game.js";
import { createPlayer } from "../players/createPlayer.js";
import { useParticles } from "../hooks/useParticles.js";
import { Setup } from "./Setup.js";
import { Board } from "./Board.js";

export function App() {
  useParticles();

  const [phase, setPhase] = useState("setup"); // "setup" | "play"
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState({ 1: createPlayer("human"), 2: createPlayer("perfect") });
  // Names the Perfect AI whose *latest* move couldn't be resolved within its
  // depth limit (so it played at random). Persists across the opponent's moves
  // and only clears when that AI next makes an exact, fully-resolved move.
  const [aiWarning, setAiWarning] = useState(null);

  const current = game && !game.isPlayer1Turn ? 2 : 1;
  const currentPlayer = players[current];
  const res = game ? game.result() : Result.NOT_FINISHED;
  const over = res !== Result.NOT_FINISHED;
  const human = currentPlayer.isHuman();

  function startGame(cfg, p1Mode, p2Mode) {
    setPlayers({ 1: createPlayer(p1Mode), 2: createPlayer(p2Mode) });
    setGame(new Game(cfg));
    setAiWarning(null);
    setPhase("play");
  }

  function newGame() {
    setPhase("setup");
    setGame(null);
    setAiWarning(null);
  }

  function applyMove(mark) {
    setGame((g) => {
      const next = g.clone();
      next.makeMove(mark);
      return next;
    });
  }

  function humanMove(mark) {
    if (!game || over || !human) return;
    // Leave any AI warning in place — it reflects the AI's last move and should
    // only change when the AI moves again, not when the human plays.
    applyMove(mark);
  }

  // AI turn loop. Whenever it's an AI player's turn, schedule its move; the
  // cleanup cancels a pending timer if the game/phase changes first (this
  // replaces the old moveToken guard against stale timers on New game).
  useEffect(() => {
    if (phase !== "play" || !game || over || human) return;
    const id = setTimeout(() => {
      const mark = currentPlayer.chooseMove(game);
      // The Perfect AI sets this when it hit its depth limit and picked randomly.
      setAiWarning(currentPlayer.lastMoveWasRandom ? playerName(current) : null);
      applyMove(mark);
    }, 200);
    return () => clearTimeout(id);
  }, [game, players, phase, over, human]);

  function playerName(n) {
    const p = players[n];
    return "Player " + n + (p.isHuman() ? "" : " (" + p.name + ")");
  }

  function statusText() {
    if (over) return "Game over";
    return playerName(current) + "'s turn";
  }

  function resultText() {
    if (res === Result.PLAYER_1_WIN) return "🏆 " + playerName(1) + " wins!";
    if (res === Result.PLAYER_2_WIN) return "🏆 " + playerName(2) + " wins!";
    return "🤝 Draw";
  }

  return html`
    <main className="stage">
      <section className="card">
        <h1>The Simplest Game</h1>
        <p className="tagline">Take turns adding <b>X</b> or <b>O</b>. Win by making your pattern repeat.</p>

        ${phase === "setup"
          ? html`<${Setup} onStart=${startGame} />`
          : html`
            <div>
              <div className="status">${statusText()}</div>
              ${aiWarning
                ? html`<div className="warning" role="alert">
                    ⚠️ ${aiWarning} can't calculate a perfect move at this search depth, so it's playing at random until the game is shallow enough to solve exactly.
                  </div>`
                : null}
              <${Board} game=${game} />
              <div className="controls">
                <button className="btn tileX" disabled=${over || !human} onClick=${() => humanMove("X")}>Place X</button>
                <button className="btn tileO" disabled=${over || !human} onClick=${() => humanMove("O")}>Place O</button>
              </div>
              ${over ? html`<div className=${"result" + (res === Result.DRAW ? " draw" : "")}>${resultText()}</div>` : null}
              <div className="actions">
                <button className="btn ghost" onClick=${newGame}>New game</button>
              </div>
            </div>`}
      </section>
    </main>`;
}

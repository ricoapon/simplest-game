// Tiny no-framework test runner — run with: node web/game.test.js
// Imports the pure logic modules (no React) and ports the GameTest.kt cases.

import { Game, Result } from "./Game.js";
import { HumanPlayer } from "./players/HumanPlayer.js";
import { RandomAiPlayer } from "./players/RandomAiPlayer.js";
import { PerfectAiPlayer } from "./players/PerfectAiPlayer.js";

let failures = 0;

function assertEquals(expected, actual, label) {
  if (expected !== actual) {
    failures++;
    console.error("FAIL: " + label + " — expected " + expected + ", got " + actual);
  } else {
    console.log("ok:   " + label);
  }
}

function playAll(game, str) {
  for (const ch of str) game.makeMove(ch);
  return game;
}

// 1. Player 1 wins: length 5 x 2 (ten X's).
{
  const g = new Game();
  playAll(g, "XXXXXXXXX"); // 9
  assertEquals(Result.NOT_FINISHED, g.result(), "P1: 9 X's not finished");
  g.makeMove("X"); // 10
  assertEquals(Result.PLAYER_1_WIN, g.result(), "P1: 10 X's -> PLAYER_1_WIN");
}

// 2. Draw: string satisfies both rules at once.
{
  const g = new Game();
  playAll(g, "OXXXOXXOXXOX");
  assertEquals(Result.NOT_FINISHED, g.result(), "DRAW: 12 chars not finished");
  g.makeMove("X");
  assertEquals(Result.DRAW, g.result(), "DRAW: +X -> DRAW");
}

// 3. Player 2 wins: length 3 x 4 without the length-5 x 2 rule.
{
  const g = new Game();
  playAll(g, "XOOXOOXOOXXXXO");
  assertEquals(Result.NOT_FINISHED, g.result(), "P2: 14 chars not finished");
  g.makeMove("O");
  assertEquals(Result.PLAYER_2_WIN, g.result(), "P2: +O -> PLAYER_2_WIN");
}

// 4. Custom config proves the numbers are wired: length 2 x 2.
{
  const g = new Game({ p1Length: 2, p1Repeats: 2 });
  playAll(g, "XO"); // "XO" once
  assertEquals(Result.NOT_FINISHED, g.result(), "custom: XO not finished");
  playAll(g, "XO"); // "XOXO" -> "XO" repeats
  assertEquals(Result.PLAYER_1_WIN, g.result(), "custom: XOXO -> PLAYER_1_WIN (len2 x2)");
}

// 5. isPlayer1Turn toggles on each move.
{
  const g = new Game();
  assertEquals(true, g.isPlayer1Turn, "turn: player 1 starts");
  g.makeMove("X");
  assertEquals(false, g.isPlayer1Turn, "turn: player 2 after one move");
  g.makeMove("O");
  assertEquals(true, g.isPlayer1Turn, "turn: player 1 after two moves");
}

// 6. winningCells marks the whole winning span.
{
  const g = new Game();
  playAll(g, "XXXXXXXXXX"); // 10 X's -> length-5 x2 span covers all 10
  assertEquals(10, g.winningCells().size, "winningCells: 10 X's highlights 10 cells");
}

// 7. Player variants: human returns null, AIs return a legal mark.
{
  const g = new Game();
  const human = new HumanPlayer();
  const random = new RandomAiPlayer();
  const perfect = new PerfectAiPlayer();
  assertEquals(true, human.isHuman(), "player: human isHuman");
  assertEquals(null, human.chooseMove(g), "player: human chooseMove is null");
  const rm = random.chooseMove(g);
  assertEquals(true, rm === "X" || rm === "O", "player: random returns X or O");
  const pm = perfect.chooseMove(g);
  assertEquals(true, pm === "X" || pm === "O", "player: perfect returns X or O");
}

if (failures === 0) {
  console.log("\nAll tests passed.");
} else {
  console.error("\n" + failures + " test(s) failed.");
  process.exit(1);
}

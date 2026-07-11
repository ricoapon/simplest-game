import htm from "htm";
import { createElement } from "react";

// Bind htm to React once, so components write markup as `html`...`` tagged
// templates (JSX-like, but needs no build/transpiler).
export const html = htm.bind(createElement);

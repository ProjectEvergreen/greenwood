// import shadow from "./theme.css" with { type: "css" }; older commented-out example
import withTheme from "./theme.css" with { type: "css" };
import a from "./shared.css" with { type: "css" };
import b from "./shared.css" with { type: "css" };
import config from "./data.json"
  with {
    type: "json"
  };

const usage = 'example: import sheet from "./theme.css" with { type: "css" };';

// the specifier below appears verbatim in a string literal BEFORE its real import and has no
// shadowing comment on that path, so the old whole-file `replace(value/line, ...)` mangles the
// string (injecting `;` and a `?polyfill` query) instead of the real import
const help = 'run: import banner from "./banner.css" with { type: "css" };';
import banner from "./banner.css" with { type: "css" };

async function loadDynamic() {
  return import("./dynamic.css", { with: { type: "css" } });
}

console.log({ withTheme, a, b, config, usage, help, banner, loadDynamic });

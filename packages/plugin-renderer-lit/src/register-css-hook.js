import { CSSStyleSheet } from "@lit-labs/ssr-dom-shim";
import "@lit-labs/ssr-dom-shim/register-css-hook.js";

// Lit's registration module installs this global when the runtime supports the asynchronous
// node:module.register() API. Deno only supports registerHooks(), so make the same DOM shim
// available for CSS modules transformed by Greenwood's synchronous loader hooks.
globalThis.CSSStyleSheet ??= CSSStyleSheet;

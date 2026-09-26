import { CSSStyleSheet } from "@lit-labs/ssr-dom-shim";
import "@lit-labs/ssr-dom-shim/register-css-hook.js";

// Lit sets this global when its CSS loader can register. Greenwood's synchronous hooks
// may transform CSS without that loader, so provide the same shim here.
globalThis.CSSStyleSheet ??= CSSStyleSheet;

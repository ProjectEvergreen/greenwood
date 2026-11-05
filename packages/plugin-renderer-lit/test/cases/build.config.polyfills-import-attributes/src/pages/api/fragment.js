// Reduced from greenwood-lit-ssr's API fragment: importing this hook exercises
// Lit's runtime CSS-import support detection while Rollup bundles the route.
import "@lit-labs/ssr-dom-shim/register-css-hook.js";
import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html } from "lit";
import "../../components/card/card.js";

export const isolation = true;

export async function handler() {
  const body = await collectResult(render(html`<app-card title="Greenwood"></app-card>`));

  return new Response(body, {
    headers: new Headers({
      "Content-Type": "text/html",
    }),
  });
}

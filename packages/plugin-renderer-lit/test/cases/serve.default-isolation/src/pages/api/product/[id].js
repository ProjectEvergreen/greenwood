import { render } from "@lit-labs/ssr";
import { collectResultSync } from "@lit-labs/ssr/lib/render-result.js";
import { html } from "lit";

export function handler(request, { params }) {
  const body = collectResultSync(render(html`<h1>Product ID: ${params.id}</h1>`));

  return new Response(body, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

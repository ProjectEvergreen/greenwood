import "@lit-labs/ssr-dom-shim/register-css-hook.js";
import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import "../../components/card/card.js";

export const isolation = true;

export async function handler() {
  const products = [
    {
      title: "Product 1",
      thumbnail: "product1.png",
    },
  ];
  const body = await collectResult(
    render(html`
      ${unsafeHTML(
        products
          .map((item, idx) => {
            const { title, thumbnail } = item;

            return `
          <app-card
            title="${idx + 1}) ${title}"
            thumbnail="${thumbnail}"
          ></app-card>
        `;
          })
          .join(""),
      )}
    `),
  );

  return new Response(body, {
    headers: new Headers({
      "Content-Type": "text/html",
    }),
  });
}

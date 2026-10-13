import { renderFromHTML } from "wc-compiler";
import { getArtists } from "../../services/artists.js";

export async function handler() {
  const html = getArtists()
    .map(
      ({ name, imageUrl }) =>
        `<app-cloudflare-card title="${name}" thumbnail="${imageUrl}"></app-cloudflare-card>`,
    )
    .join("");
  const result = await renderFromHTML(html, [new URL("../../components/card.js", import.meta.url)]);

  return new Response(result.html, {
    headers: { "Content-Type": "text/html" },
  });
}

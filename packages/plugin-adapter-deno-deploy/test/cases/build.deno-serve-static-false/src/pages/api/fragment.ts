import { renderFromHTML } from "wc-compiler";
import { getArtists } from "../../services/artists.ts";

export async function handler() {
  const html = getArtists()
    .map(({ name, imageUrl }) => `<app-card title="${name}" thumbnail="${imageUrl}"></app-card>`)
    .join("");
  const result = await renderFromHTML(html, [new URL("../../components/card.ts", import.meta.url)]);

  return new Response(result.html, {
    headers: { "Content-Type": "text/html" },
  });
}

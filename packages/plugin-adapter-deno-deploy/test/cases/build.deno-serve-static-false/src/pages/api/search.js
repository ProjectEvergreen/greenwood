import { renderFromHTML } from "wc-compiler";
import { getArtists } from "../../services/artists.js";

export async function handler(request) {
  const term = (await request.formData()).get("term")?.toLowerCase() ?? "";
  const matches = getArtists().filter(({ name }) => name.toLowerCase().includes(term));
  const html = matches.length
    ? matches
        .map(
          ({ name, imageUrl }) => `<app-card title="${name}" thumbnail="${imageUrl}"></app-card>`,
        )
        .join("")
    : "No results found.";
  const body = matches.length
    ? (await renderFromHTML(html, [new URL("../../components/card.js", import.meta.url)])).html
    : html;

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

import { renderFromHTML } from "wc-compiler";
import { getArtists } from "../../services/artists.ts";

export async function handler(request: Request) {
  const term = String((await request.formData()).get("term") ?? "").toLowerCase();
  const matches = getArtists().filter(({ name }) => name.toLowerCase().includes(term));
  const html = matches.length
    ? matches
        .map(
          ({ name, imageUrl }) => `<app-card title="${name}" thumbnail="${imageUrl}"></app-card>`,
        )
        .join("")
    : "No results found.";
  const body = matches.length
    ? (await renderFromHTML(html, [new URL("../../components/card.ts", import.meta.url)])).html
    : html;

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

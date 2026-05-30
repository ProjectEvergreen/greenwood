import { html } from "lit";
import fs from "node:fs/promises";

async function getBody(compilation, page, request, params) {
  const artists = JSON.parse(
    await fs.readFile(new URL("../../../artists.json", import.meta.url), "utf-8"),
  );
  const artist = artists.find((artist) => artist.name.toLowerCase() === params.name);

  return html`
    <h1>${artist.name}</h1>
    <img src="${artist.imageUrl}" /></td>
  `;
}

export { getBody };

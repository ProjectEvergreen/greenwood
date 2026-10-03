import "../components/card.ts";
import { getArtists } from "../services/artists.ts";

export default class ArtistsPage extends HTMLElement {
  connectedCallback() {
    const artists = getArtists();

    this.innerHTML = `
      <h1>List of Artists: ${artists.length}</h1>
      ${artists
        .map(
          ({ name, imageUrl }) => `<app-card title="${name}" thumbnail="${imageUrl}"></app-card>`,
        )
        .join("")}
    `;
  }
}

import "../components/card.js";
import { getArtists } from "../services/artists.js";

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

import "../components/card.js";
import { getArtists } from "../services/artists.js";

export default class UsersPage extends HTMLElement {
  connectedCallback() {
    const { name, imageUrl } = getArtists()[0];

    this.innerHTML = `
      <h1>Users</h1>
      <app-card title="${name}" thumbnail="${imageUrl}"></app-card>
    `;
  }
}

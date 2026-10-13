import "../components/card.js";
import { getArtists } from "../services/artists.js";

export const prerender = true;

export default class UsersPage extends HTMLElement {
  connectedCallback() {
    const { name, imageUrl } = getArtists()[0];

    this.innerHTML = `
      <h1>Users</h1>
      <app-cloudflare-card title="${name}" thumbnail="${imageUrl}"></app-cloudflare-card>
    `;
  }
}

import '../components/card.js';
import { getArtists } from '../services/artists.js';

export default class ArtistsPage extends HTMLElement {
  async connectedCallback() {
    const artists = getArtists();
    const html = artists.map(artist => {
      const { name, imageUrl } = artist;

      return `
        <app-card
          title="${name}"
          thumbnail="${imageUrl}"
        >
        </app-card>
      `;
    }).join('');

    this.innerHTML = `
      <a href="/">&lt; Back</a>
      <h1>List of Artists: ${artists.length}</h1>
      ${html}
    `;
  }
}
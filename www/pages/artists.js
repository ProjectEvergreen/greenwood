import '../components/card/card.native.js';
import fetch from 'node-fetch';

export default class ArtistsPage extends HTMLElement {
  async connectedCallback() {
    if (!this.shadowRoot) {
      const artists = await fetch('https://www.analogstudios.net/api/artists').then(resp => resp.json());
      const html = artists.map(artist => {
        return `
          <wc-card>
            <h2 slot="title">${artist.name}</h2>
            <img slot="image" src="${artist.imageUrl}" alt="${artist.name}"/>
          </wc-card>
        `;
      }).join('');

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <template shadowroot="open">
          ${html}
        </template>
      `;
    }
  }
}

async function getFrontmatter() {
  return {
    menu: 'navigation',
    index: 7
  };
}

export {
  getFrontmatter
};
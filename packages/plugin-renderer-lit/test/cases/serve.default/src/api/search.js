import { render } from '@lit-labs/ssr';
import { collectResultSync } from '@lit-labs/ssr/lib/render-result.js';
import fs from 'fs';
import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../components/card.js';

export async function handler(request) {
  const artists = JSON.parse(fs.readFileSync(new URL('../../artists.json', import.meta.url), 'utf-8'));
  const formData = await request.formData();
  const term = formData.has('term') ? formData.get('term') : '';
  const filteredArtists = artists.filter((artist) => {
    return term !== '' && artist.name.toLowerCase().includes(term.toLowerCase());
  });
  let body = '';

  if (filteredArtists.length === 0) {
    body = 'No results found.';
  } else {
    body = collectResultSync(render(html`
      ${
        unsafeHTML(filteredArtists.map((item, idx) => {
          const { name, imageUrl } = item;

          return `
            <app-card
              title="${idx + 1}) ${name}"
              thumbnail="${imageUrl}"
            ></app-card>
          `;
        }).join(''))
      }
    `));
  }

  return new Response(body, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}
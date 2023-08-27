import { renderFromHTML } from 'wc-compiler';
import { getArtists } from '../services/artists.js';

export async function handler(request) {
  const formData = await request.formData();
  const term = formData.has('term') ? formData.get('term') : '';
  const artists = (await getArtists())
    .filter((artist) => {
      return term !== '' && artist.name.toLowerCase().includes(term.toLowerCase());
    });
  let body = '';

  if (artists.length === 0) {
    body = 'No results found.';
  } else {
    const { html } = await renderFromHTML(`
      ${
        artists.map((item, idx) => {
          const { name, imageUrl } = item;

          return `
            <app-card
              title="${idx + 1}) ${name}"
              thumbnail="${imageUrl}"
            ></app-card>
          `;
        }).join('')
      }
    `, [
      new URL('../components/card.js', import.meta.url)
    ]);

    body = html;
  }

  return new Response(body, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}
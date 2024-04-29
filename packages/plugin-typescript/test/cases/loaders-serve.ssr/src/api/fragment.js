import { renderFromHTML } from 'wc-compiler';

export async function handler() {
  const products = [{
    name: 'iPhone 12',
    thumbnail: 'iphone-12.png'
  }, {
    name: 'Samsung Galaxy',
    thumbnail: 'samsung-galaxy.png'
  }];
  const { html } = await renderFromHTML(`
    ${
      products.map((product) => {
        const { name, thumbnail } = product;

        return `
          <app-card
            title="${name}"
            thumbnail="${thumbnail}"
          ></app-card>
        `;
      }).join('')
    }
  `, [
    new URL('../components/card/card.ts', import.meta.url)
  ]);

  return new Response(html, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}
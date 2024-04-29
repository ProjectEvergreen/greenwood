import { renderFromHTML } from 'wc-compiler';
import { getProducts } from '../services/products.js';

export async function handler() {
  const products = await getProducts();
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
    new URL('../components/card.js', import.meta.url)
  ]);

  return new Response(html, {
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
}
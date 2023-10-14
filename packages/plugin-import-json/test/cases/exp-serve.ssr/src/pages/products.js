import '../components/card.js';
import products from '../data/products.json';

export default class ProductsPage extends HTMLElement {
  async connectedCallback() {
    const html = products.map(product => {
      const { name, thumbnail } = product;

      return `
        <app-card
          title="${name}"
          thumbnail="${thumbnail}"
        >
        </app-card>
      `;
    }).join('');

    this.innerHTML = `
      <h2>SSR Page (w/ WCC)</h2>
      <h3>List of Products: ${products.length}</h3>
      <div class="products-cards-container">
        ${html}
      </div>
    `;
  }
}
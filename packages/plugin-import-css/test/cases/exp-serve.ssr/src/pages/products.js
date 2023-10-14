import '../components/card.js';
import { getProducts } from '../services/products.js';
import styles from '../styles/some.css';

export default class ProductsPage extends HTMLElement {
  async connectedCallback() {
    const products = await getProducts();
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
      <style>
        ${styles}
      </style>
      <div class="products-cards-container">
        ${html}
      </div>
    `;
  }
}
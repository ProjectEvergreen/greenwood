import fs from 'fs';
import { html } from 'lit';
import '../components/footer.js';

export const isolation = false;
// export const hydration = true;

// export async function loader(request = null) {
//   const products = await getProducts();

//   return { products };
// }
export const hydration = true;

export async function getBody() {
  const users = JSON.parse(fs.readFileSync(new URL('../../artists.json', import.meta.url), 'utf-8'));

  return html`
    <h1>Users Page</h1>
    <div id="users">${users.length}</div>
    <app-footer></app-footer>
  `;
}
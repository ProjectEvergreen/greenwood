import fs from 'fs';
import { html, LitElement } from 'lit';
import '../components/footer.js';

class UsersComponent extends LitElement {

  constructor() {
    super();
    this.users = JSON.parse(fs.readFileSync(new URL('../../artists.json', import.meta.url), 'utf-8'));
  }

  render() {
    return html`
      <h1>Users Page</h1>
      <div id="users">${this.users.length}</div>
      <app-footer></app-footer>
    `;
  }
}

customElements.define('app-users', UsersComponent);

export const isolation = false;
export const tagName = 'app-users';
export default UsersComponent;
import '../components/card.js';

export default class UsersPage extends HTMLElement {
  async connectedCallback() {
    const users = [{
      name: 'Foo',
      thumbnail: 'foo.jpg'
    }];
    const html = users.map(user => {
      const { name, imageUrl } = user;

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
      <h1>List of Users: ${users.length}</h1>
      ${html}
    `;
  }
}
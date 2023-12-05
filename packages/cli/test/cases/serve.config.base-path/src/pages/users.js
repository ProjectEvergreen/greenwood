import ARTISTS_TEST_HTTPS_ENDPOINT from '../../../../test-constants';
export default class UsersPage extends HTMLElement {
  async connectedCallback() {
    const users = await fetch(ARTISTS_TEST_HTTPS_ENDPOINT).then(resp => resp.json());
    const html = users.map(user => {
      return `
        <section>
          <h2 slot="title">${user.name}</h2>
          <img slot="image" src="${user.imageUrl}" alt="${user.name}"/>
        </section>
      `;
    }).join('');

    this.innerHTML = `
      <h1>List of Users: <span id="count">${users.length}</span></h1>
      ${html}
    `;
  }
}
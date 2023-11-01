export default class UsersPage extends HTMLElement {
  async connectedCallback() {
    const users = [{
      name: 'Foo',
      thumbnail: 'foo.jpg'
    }];
    const html = users.map(user => {
      const { name, imageUrl } = user;

      return `
        <article>
          <h2>${name}</h2>
          <img src="${imageUrl}"/>
        </article>
      `;
    }).join('');

    this.innerHTML = `
      <a href="/">&lt; Back</a>
      <h1>List of Users: ${users.length}</h1>
      ${html}
    `;
  }
}
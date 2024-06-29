export default class BlogPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>Duplicated and nested SSR page should work!</h1>
    `;
  }
}
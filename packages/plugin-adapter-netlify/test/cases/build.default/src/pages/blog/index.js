export default class BlogPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>nested SSR page should work!</h1>
    `;
  }
}
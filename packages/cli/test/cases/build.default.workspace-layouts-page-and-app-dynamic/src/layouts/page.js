export default class PageLayout extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `
      <body>
        <h2>Page Layout</h2>
        <content-outlet></content-outlet>
      </body>
    `;
  }
}
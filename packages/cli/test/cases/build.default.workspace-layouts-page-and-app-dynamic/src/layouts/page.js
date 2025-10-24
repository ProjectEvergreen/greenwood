export default class PageLayout extends HTMLElement {
  constructor({ compilation, page }) {
    super();
    this.route = page.route;
    this.numPages = compilation.graph.length;
  }

  async connectedCallback() {
    this.innerHTML = `
      <html>
        <body>
          <h2>Page Layout for ${this.route}</h2>
          <span>Number of pages ${this.numPages}</span>
          <outlet for="content"></outlet>
        </body>
      </html>
    `;
  }
}

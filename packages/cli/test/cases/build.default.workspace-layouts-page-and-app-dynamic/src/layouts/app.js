export default class AppLayout extends HTMLElement {
  async connectedCallback() {
    const year = new Date().getFullYear();

    this.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>App Layout</title>
        </head>

        <body>
          <h1>App Layout</h1>
          <page-outlet></page-outlet>
          <footer>${year}</footer>
        </body>
      </html>
    `;
  }
}
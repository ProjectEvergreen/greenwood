export default class AppLayout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <!doctype html>
      <html lang="en" prefix="og:http://ogp.me/ns#">
        <head>
          <title>TypeScript App Layout</title>
        </head>
        <body>
          <h1>TypeScript App Layout</h1>
          <output for="page"></output>
        </body>
      </html>
    `;
  }
}

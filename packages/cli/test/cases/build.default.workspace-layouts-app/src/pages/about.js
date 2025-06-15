const html = `
<html>
  <head>
    <title>About Page</title>
  </head>
  <body>
    <h1>About Page</h1>
  </body>
</html>
`;

export default class AboutPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

export const prerender = true;

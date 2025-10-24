const html: string = `
<!doctype html>
<html lang="en" prefix="og:http://ogp.me/ns#">
  <head>
    <title>TypeScript Blog Page Layout</title>
  </head>
  <body>
    <h2>TypeScript Blog Page Layout</h2>
    <outlet for="content"></outlet>
  </body>
</html>
`;

export default class BlogLayout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

const html: string = `
<!doctype html>
<html lang="en" prefix="og:http://ogp.me/ns#">
  <head>
    <title>Default Page Layout</title>
  </head>
  <body>
    <h2>Default Page Layout</h2>
    <content-outlet></content-outlet>
  </body>
</html>
`;

export default class BlogLayout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

const html: string = `
<!doctype html>
<html lang="en" prefix="og:http://ogp.me/ns#">
  <body>
    <h2>Default Page Layout</h2>
    <outlet for="content"></outlet>
  </body>
</html>
`;

export default class BlogLayout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

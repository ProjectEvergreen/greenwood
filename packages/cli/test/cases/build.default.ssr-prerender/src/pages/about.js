import "../components/logo.js";

const html = `
<body>
  <main>
    <h1>Welcome to Greenwood!</h1>

    <app-logo></app-logo>
  </main>
</body>
`;

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html;
  }
}

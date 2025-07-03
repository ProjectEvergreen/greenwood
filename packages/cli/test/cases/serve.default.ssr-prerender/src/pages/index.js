import "../components/social-links.js";

export default class HomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <body>
        <h1>This is the home page.</h1>
        <app-social-links></app-social-links>
      </body>
    `;
  }
}

export default class SocialLinksComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <ul>
        <li><a href="www.github.com">GitHub</a></li>
        <li><a href="www.youtube.com">YouTube</a></li>
        <li><a href="www.twitter.com">Twitter</a></li>
      </ul>
    `;
  }
}

customElements.define('app-social-links', SocialLinksComponent);
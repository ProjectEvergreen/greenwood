import packageJson from '../../package.json';

export default class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.getTemplate();
  }

  getTemplate() {
    const { name, version } = packageJson;
    const year = new Date().getFullYear();

    return `
      <footer>
        <h4>
          My Blog ${year} - Built with ${name}-v${version}
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);
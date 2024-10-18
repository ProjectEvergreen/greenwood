import css from './footer.css?type=raw';

export default class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.getTemplate();
  }

  getTemplate() {
    const year = new Date().getFullYear();

    return `
      <style>
        ${css}
      </style>

      <footer class="footer">
        <h4>
          <a href="https://www.greenwoodjs.io/">My Blog &copy;${year}</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);
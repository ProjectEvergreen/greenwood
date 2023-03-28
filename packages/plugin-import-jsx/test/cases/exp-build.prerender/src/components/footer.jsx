export default class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <footer>
        <h4>My Blog</h4>
      </footer>
    );
  }
}

customElements.define('app-footer', FooterComponent);
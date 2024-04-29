export default class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const year = new Date().getFullYear();

    return (
      <footer>
        <h4>My Blog - {year}</h4>
      </footer>
    );
  }
}

customElements.define('app-footer', FooterComponent);
// note: this example is misleading in its understanding / use of shadow dom
// but leaving it as since it should also technically work as written too
export default class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    // create a Shadow DOM
    this.root = this.attachShadow({ mode: 'open' });
  }

  // run some code when the component is ready
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // create templates that interpolate variables and HTML!
  getTemplate() {
    return `
      <header>This is the header component.</header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);
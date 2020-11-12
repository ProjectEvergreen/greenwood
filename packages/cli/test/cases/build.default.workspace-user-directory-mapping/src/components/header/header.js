import service from '../../services/components.js';
import '../../services/pages/pages.js';

class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    service('hello world');
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.root.innerHTML = '<header>This is the header component.</header>';
  }

}

customElements.define('x-header', HeaderComponent);
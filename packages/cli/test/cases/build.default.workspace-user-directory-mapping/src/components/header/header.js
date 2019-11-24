import service from '../../services/pages';

class HeaderComponent extends HTMLElement {
  constructor() {
    service('hello world');
  }
}

customElements.define('x-header', HeaderComponent);
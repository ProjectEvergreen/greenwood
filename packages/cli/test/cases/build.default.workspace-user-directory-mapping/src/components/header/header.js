import service from '../../services/components';
import '../../services/pages/pages';

class HeaderComponent extends HTMLElement {
  constructor() {
    service('hello world');
  }
}

customElements.define('x-header', HeaderComponent);
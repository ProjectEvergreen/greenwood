import { html, LitElement } from 'lit-element';

class scroll extends LitElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.handleHashChange.bind(this), false);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.handleHashChange.bind(this), false);
    super.disconnectedCallback();
  }

  handleHashChange() {
    // on hash change child event, scroll content
    const contains = (selector, text) => {
      const elements = this.querySelectorAll(selector);

      return Array.prototype.filter.call(elements, (element) =>{
        return RegExp(text, 'gmi').test(element.textContent);
      });
    };

    let { hash } = window.location;

    // clean hash string, remove # and replace - with spaces
    hash = hash.replace('#', '');
    hash = hash.replace('-', ' ').toLowerCase();

    // query text
    const heading = contains('h3', hash)[0];

    heading.scrollIntoView(true);
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

customElements.define('eve-scroll', scroll);
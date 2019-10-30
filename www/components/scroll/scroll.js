import { html, LitElement } from 'lit-element';

class scroll extends LitElement {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.handleHashChange.bind(this), false);
    window.addEventListener('load', this.handleHashChange.bind(this), false);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.handleHashChange.bind(this), false);
    window.removeEventListener('load', this.handleHashChange.bind(this), false);
    super.disconnectedCallback();
  }

  handleHashChange() {
    // on hash change child event, scroll content
    const contains = (selector, text) => {
      const elements = this.querySelectorAll(selector);

      return Array.from(elements).filter((element) => {
        return RegExp(text, 'gmi').test(element.textContent);
      });
    };

    let { hash } = window.location;

    // clean hash string, remove # and replace - with spaces
    hash = hash.replace('#', '').toLowerCase();
    // for cases of multiple hyphens
    hash = hash.replace(/-/g, ' ');
    // query text
    const heading = contains('h3', hash)[0];

    if (heading !== undefined) {
      heading.scrollIntoView(true);
    }

  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

customElements.define('eve-scroll', scroll);

import { html, LitElement } from 'lit';

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
        let el = RegExp(text, 'gmi').test(element.href);
        let href = element.href;
        if (el && href.substr(href.length - text.length, href.length) === text && (el.tagName && el.tagName.toLowerCase() === 'h3')) {
          return el;
        }
      });
    };

    let { hash } = window.location;

    // query hash text
    const heading = contains('a', hash)[0];

    if (heading) {
      heading.scrollIntoView(true);
    }
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

customElements.define('app-scroll', scroll);
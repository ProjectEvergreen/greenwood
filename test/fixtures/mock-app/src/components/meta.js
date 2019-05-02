import { html, LitElement } from 'lit-element';

class meta extends LitElement {

  static get properties() {
    return {
      attributes: {
        type: Object
      }
    };
  }

  firstUpdated() {
    let header = document.head;
    let meta;

    this.attributes.meta.map(attr => {
      meta = document.createElement('meta');
      meta.setAttribute(Object.keys(attr)[0], Object.values(attr)[0]);
      meta.setAttribute(Object.keys(attr)[1], Object.values(attr)[1]);
      header.appendChild(meta);
    });
    let title = document.createElement('title');

    title.innerText = this.attributes.title;
    const oldTitle = document.head.querySelector('title');

    header.replaceChild(title, oldTitle);
  }

  render() {
    return html`
      <div>
        
      </div>
    `;
  }
}

customElements.define('eve-meta', meta);
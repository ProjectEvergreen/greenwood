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

    if (this.attributes) {        
      this.attributes.meta.map(attr => {
        meta = document.createElement('meta');

        const metaKey1 = Object.keys(attr)[0];
        const metaVal1 = Object.values(attr)[0];

        const metaKey2 = Object.keys(attr)[1];
        let metaVal2 = Object.values(attr)[1];
        
        // insert origin domain into url
        if (metaVal1 === 'og:url') {
          metaVal2 = window.location.origin + metaVal2;
        }

        meta.setAttribute(metaKey1, metaVal1);
        meta.setAttribute(metaKey2, metaVal2);

        const oldmeta = header.querySelector(`[${Object.keys(attr)[0]}="${Object.values(attr)[0]}"]`);
        
        // rehydration
        if (oldmeta) {
          header.replaceChild(meta, oldmeta);
        } else {
          header.appendChild(meta);
        }
      });
      let title = document.createElement('title');

      title.innerText = this.attributes.title;
      const oldTitle = document.head.querySelector('title');

      header.replaceChild(title, oldTitle);
    }

  }

  render() {
    return html`
      <div>
        
      </div>
    `;
  }
}

customElements.define('eve-meta', meta);
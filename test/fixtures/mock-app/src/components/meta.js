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

    this.attributes.map((attr) => {
      meta = document.createElement('meta');
      meta.setAttribute(attr[0], attr[1]);
      header.appendChild(meta);
    });
  }

  render() {
    return html`
        <div>
                
        </div>
    `;
  }
}

customElements.define('eve-meta', meta);
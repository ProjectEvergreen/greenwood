import { html, LitElement } from 'lit-element';

/*
* Take an attributes object with an array of meta objects, add them to an element and replace/add the element to DOM
*  {
*   title: 'my title',
*   meta: [
*     { property: 'og:site', content: 'greenwood' },
*     { name: 'twitter:site', content: '@PrjEvergreen ' }
*   ]
*  }
*/

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

        const metaPropertyOrName = Object.keys(attr)[0];
        const metaPropValue = Object.values(attr)[0];
        let metaContentVal = Object.values(attr)[1];
        
        // insert origin domain into url
        if (metaPropValue === 'og:url') {
          metaContentVal = window.location.origin + metaContentVal;
        }

        meta.setAttribute(metaPropertyOrName, metaPropValue);
        meta.setAttribute('content', metaContentVal);

        const oldmeta = header.querySelector(`[${metaPropertyOrName}="${metaPropValue}"]`);
        
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
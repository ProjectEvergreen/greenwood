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
      // handle <meta> + <link> tags
      this.attributes.meta.forEach(metaItem => {
        const metaType = Object.keys(metaItem)[0]; // property or name attribute
        const metaTypeValue = metaItem[metaType]; // value of the type attribute
        let metaContent = metaItem.content; // value of the content attribute

        if (metaType === 'rel') {
          meta = document.createElement('link');

          meta.setAttribute(metaType, metaTypeValue);
          meta.setAttribute('href', metaContent);
        } else {
          meta = document.createElement('meta');

          if (metaTypeValue === 'og:url') {
            metaContent = `${metaContent}${this.attributes.route}`;
          }
  
          meta.setAttribute(metaType, metaTypeValue);
          meta.setAttribute('content', metaContent);
        }

        const oldmeta = header.querySelector(`[${metaType}="${metaTypeValue}"]`);
        
        // rehydration
        if (oldmeta) {
          header.replaceChild(meta, oldmeta);
        } else {
          header.appendChild(meta);
        }
      });

      // handle <title> tag
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
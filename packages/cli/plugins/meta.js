import { LitElement } from 'lit-element';

/*
* Take an attributes object with an array of meta objects, add them to an element and replace/add the element to DOM
*  {
*   title: 'my title',
*   meta: [
*     { property: 'og:site', content: 'greenwood' },
*     { name: 'twitter:site', content: '@PrjEvergreen' },
*     { rel: 'icon', content: '/assets/favicon.ico ' }
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
    if (this.attributes) {      
      let header = document.head;

      // handle <meta> + <link> tags
      this.attributes.meta.forEach(metaItem => {
        const metaType = Object.keys(metaItem)[0]; // property or name attribute
        const metaTypeValue = metaItem[metaType]; // value of the attribute
        let meta = document.createElement('meta');

        if (metaType === 'rel') {
          // change to a <link> tag instead
          meta = document.createElement('link');

          meta.setAttribute(metaType, metaTypeValue);
          meta.setAttribute('href', metaItem.href);
        } else {
          const metaContent = metaTypeValue === 'og:url' 
            ? `${metaItem.content}${this.attributes.route}` 
            : metaItem.content;
  
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
}

customElements.define('eve-meta', meta);
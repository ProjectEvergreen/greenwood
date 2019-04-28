/// MADE REDUNDANT BY https://github.com/ProjectEvergreen/greenwood/pull/52
import { html, LitElement } from 'lit-element';

MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html`
      <div class='wrapper'>
        <div class='page-template content'>
          <entry></entry>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);
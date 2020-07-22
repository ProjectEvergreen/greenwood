import { html, LitElement } from 'lit-element';
import '@evergreen-wc/eve-container';
import '../components/shelf/shelf';
import '../components/scroll/scroll';
import pageCss from '../styles/page.css';
import '../styles/theme.css';

class PageTemplate extends LitElement {

  static get properties() {
    return {
      route: {
        type: String
      }
    };
  }

  constructor() {
    super();
    this.route = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.route = window.location.pathname;
  }

  render() {
    const { route } = this;
    const page = route.split('/')[1];

    return html`
      <style>
        ${pageCss}
      </style>

      <div class='gwd-content-wrapper'>
        <div class="gwd-sidebar">
          <eve-shelf .page="${page}"></eve-shelf>
        </div>

        <div class="gwd-content">
          <eve-container fluid>
            <eve-scroll>
              <entry></entry>
            </eve-scroll>
          </eve-container>
        </div>
      </div>
    `;
  }
}

customElements.define('page-template', PageTemplate);
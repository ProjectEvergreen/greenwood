import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import NavigationQuery from '@greenwood/cli/data/queries/navigation';
import '@evergreen-wc/eve-container';
import headerCss from './header.css';
import brand from '../../assets/brand.png';
import '../components/social-icons/social-icons';

class HeaderComponent extends LitElement {
  
  static get properties() {
    return {
      navigation: {
        type: Array
      }
    };
  }

  constructor() {
    super();
    this.navigation = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    const response = await client.query({
      query: NavigationQuery
    });

    this.navigation = response.data.navigation;
  }

  /* eslint-disable indent */
  render() {
    const { navigation } = this;

    return html`
      <style>
        ${headerCss}
      </style>
      <header class="header">
        <eve-container fluid>
          <div class="head-wrap">
            
            <div class="brand">
              <a href="https://projectevergreen.github.io" target="_blank" rel="noopener noreferrer"
                @onclick="getOutboundLink('https://projectevergreen.github.io'); return false;" >
                <img src="${brand}" alt="Greenwood logo"/>
              </a>
              <div class="project-name">
                <a href="/">Greenwood</a>
              </div>
            </div>

            <nav>
              <ul>
                ${navigation.map((item) => {
                  return html`
                    <li><a href="${item.link}" title="Click to visit the ${item.label} page">${item.label}</a></li>
                  `;
                })}
              </ul>
            </nav>

            <eve-social-icons></eve-social-icons>

          </div>
        </eve-container>
      </header>
    `;
    /* eslint-enable */
  }
}

customElements.define('eve-header', HeaderComponent);
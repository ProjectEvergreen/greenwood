import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import MenuQuery from '@greenwood/cli/data/queries/menu';
import '@evergreen-wc/eve-container';
import headerCss from './header.css';
import evergreenLogo from '../../assets/evergreen.svg';
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
      query: MenuQuery,
      variables: {
        name: 'navigation',
        order: 'index_asc'
      }
    });

    this.navigation = response.data.menu.children;
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
                onclick="getOutboundLink('https://projectevergreen.github.io');">
<<<<<<< HEAD
                <img 
                  src="${brand64}" 
                  alt="Greenwood logo"
                  srcset="${brand32} 1x,
                      ${brand64} 2x,
                      ${brand128} 3x,
                      ${brand256} 4x,
                      ${brand512} 5x"/>
=======
                <img src="${evergreenLogo}" alt="Greenwood logo"/>
>>>>>>> 61c2f289358b795b4bdd10c3d140967a5e69552f
              </a>
              <div class="project-name">
                <a href="/">Greenwood</a>
              </div>
            </div>

            <nav>
              <ul>
                ${navigation.map(({ item }) => {
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

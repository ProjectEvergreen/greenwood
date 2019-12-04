import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import client from '@greenwood/cli/data/client';
// import HelloQuery from '@greenwood/cli/data/queries/hello';
import NavigationQuery from '@greenwood/cli/data/queries/graph';
import '@evergreen-wc/eve-container';

console.log(NavigationQuery);

import headerCss from './header.css';
import brand from '../../assets/brand.png';
import '../components/social-icons/social-icons';

class HeaderComponent extends ApolloQuery {
  
  constructor() {
    super();
    this.client = client;
    this.query = NavigationQuery;
  }

  render() {
    console.log('render header????', this.data);

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
                <li><a href="/about">About</a></li>
                <li><a href="/getting-started">Getting Started</a></li>
                <li><a href="/docs">Docs</a></li>
                <li><a href="/plugins">Plugins</a></li>
              </ul>
            </nav>
            <eve-social-icons></eve-social-icons>
          </div>
        </eve-container>
      </header>
    `;
  }
}

customElements.define('eve-header', HeaderComponent);
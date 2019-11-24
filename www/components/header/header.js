import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import gql from 'graphql-tag';
import '@evergreen-wc/eve-container';
import client from '/lib/graphql-client'; // TODO @greenwood/cli/???

import headerCss from './header.css';
import brand from '../../assets/brand.png';
import '../components/social-icons/social-icons';

// TODO load queries via webpack
// https://www.apollographql.com/docs/react/integrations/webpack/
const query = gql`
  query Query {
    hello
  }
`;

class HeaderComponent extends ApolloQuery {
  
  constructor() {
    super();
    this.client = client;
    this.query = query;
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
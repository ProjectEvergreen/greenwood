import client from '@greenwood/cli/data/client';
import gql from 'graphql-tag';
import { html, LitElement } from 'lit-element';

import '../components/banner/banner';
import '../components/card/card';
import '../components/header/header';
import '../components/footer/footer';
import '../components/row/row';
import '@evergreen-wc/eve-container';
import '../styles/theme.css';
import homeCss from '../styles/home.css';

MDIMPORT;

class HomeTemplate extends LitElement {

  async connectedCallback() {
    super.connectedCallback();
    const response = await client.query({
      query: gql`query {
        graph {
          title,
          link,
          data {
            noop
          }
        }
      }`
    });

    console.log('response', response);
  }
  
  render() {
    return html`
      <style>
        ${homeCss}
      </style>
        <eve-banner></eve-banner>
        <div class='gwd-content-wrapper'>
          <eve-container fluid>
            <div class='gwd-page-template gwd-content'>
              <entry></entry>
            </div>
          </eve-container>
      </div>
    `;
  }
}

customElements.define('page-template', HomeTemplate);
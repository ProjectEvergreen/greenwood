import { html, LitElement } from 'lit-element';
import '@evergreen-wc/eve-container';

import headerCss from './header.css';
import evergreenLogo from '../../assets/project-evergreen-logo.png';

class HeaderComponent extends LitElement {
  render() {
    return html`
      <style>
        ${headerCss}
      </style>
      <header class="header">
        <eve-container fluid>
          <div class="head-wrap">
            <div class="brand">
              <img src="${evergreenLogo}" />
                <h4>
                  <a href="/">Greenwood</a>
                </h4>
            </div>
            <nav>
              <ul>
                <li><a href="/about">About</a></li>
                <li><a href="/getting-started">Getting Started</a></li>
                <li><a href="/docs">Docs</a></li>
              </ul>
            </nav>
            <div class="social">
              <a href="">
                <a href="https://github.com/ProjectEvergreen/greenwood">
                  <img src="https://img.shields.io/github/stars/ProjectEvergreen/create-evergreen-app.svg?style=social&logo=github&label=github" />
                </a>
              </a>
            </div>
          </div>
        </eve-container>
      </header>
    `;
  }
}

customElements.define('eve-header', HeaderComponent);
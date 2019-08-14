import { html, LitElement } from 'lit-element';
import '@evergreen-wc/eve-container';

import headerCss from './header.css';
import brand from '../../assets/brand.png';

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
              <a href="https://projectevergreen.github.io" target="_blank" rel="noopener noreferrer">
                <img src="${brand}" />
              </a>
              <h4 class="project-name">
                <a href="/">Greenwood</a>
              </h4>
            </div>
            <nav>
              <ul>
                <a href="/about"><li>About</li></a>
                <a href="/getting-started"><li>Getting Started</li></a>
                <a href="/docs"><li>Docs</li></a>
              </ul>
            </nav>
            <div class="social">
              <a href="">
                <a href="https://github.com/ProjectEvergreen/greenwood">
                  <img src="https://img.shields.io/github/stars/ProjectEvergreen/greenwood.svg?style=social&logo=github&label=github" />
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

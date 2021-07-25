import { css, html, LitElement } from 'lit';

class FooterComponent extends LitElement {

  constructor() {
    super();
    this.version = '0.11.1';
  }

  static get styles() {
    return css`
      .footer {
        background-color: #192a27;
        min-height: 30px;
        padding-top: 10px;
      }

      h4 {
        width: 90%;
        margin: 0 auto;
        padding: 0;
        text-align: center;
      }

      a {
        color: white;
        text-decoration: none;
      }

      span.separator {
        color: white;
      }
    `;
  }

  render() {
    const { version } = this;
    
    return html`
      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${version}</a> <span class="separator">&#9672</span> <a href="https://www.netlify.com/">This site is powered by Netlify</a>
        </h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);
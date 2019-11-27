import { html, LitElement } from 'lit-element';
import './spinner';

class loading extends LitElement {
  render() {
    return html`
      <style>
        div {
          padding-top:50px;
          height: calc(100vh - 110px);
        }
        h1 {
          padding: 30px;
          text-align:center;
        }
      </style>
      <div>
        <eve-spinner size="100px"></eve-spinner>
        <h1>Loading...</h1>
      </div>
    `;
  }
}

customElements.define('eve-loading', loading);
import { html, LitElement } from 'lit-element';

class spinner extends LitElement {

  static get properties() {
    return {
      size: {
        type: String
      }
    };
  }

  render() {
    return html`
      <style>
        .spinner {
          width: ${this.size};
          padding: 10px;
          margin-left:auto;
          margin-right:auto;
        }
      </style>
      <div class="spinner">
        <svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="${this.size}"
         height="${this.size}" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">
          <path fill="#000"
          d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
          transform="rotate(190.358 25 25)">
          <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"></animateTransform>
          </path>
        </svg>
      </div>
    `;
  }
}

customElements.define('eve-spinner', spinner);
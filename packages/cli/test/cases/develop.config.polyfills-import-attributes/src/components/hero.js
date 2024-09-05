// intentionally break formatting to validate our AST parsing is not impacted / naive
import sheet from './hero.css'
with { type: 'css' }; // eslint-disable-line indent
import theme from '../theme.css' with { type: 'css' };
import json from './hero.json'
  with { type: 'json' };

const template = document.createElement('template');

template.innerHTML = `
  <div class="hero">
    <h2>Welcome to my website</h2>
    
    <a href="#">
      <button>Get Started</button>
    </a>
    <a href="#">
      <button>Learn More &#8594</button>
    </a>

  </div>
`;

export default class HeroBanner extends HTMLElement {
  clickButton(el) {
    const content = el.textContent;
    const buttonClickedEvent = new CustomEvent('update-modal', {
      detail: {
        content: `You selected "${content}"`
      }
    });

    console.log('clicked button =>', content);

    window.dispatchEvent(buttonClickedEvent);
  }

  connectedCallback() {
    console.log({ sheet, json });

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.adoptedStyleSheets = [theme, sheet];
    this.shadowRoot.querySelectorAll('button')
      .forEach(button => {
        button.addEventListener('click', () => this.clickButton(button));
      });
  }
}

customElements.define('app-hero', HeroBanner);
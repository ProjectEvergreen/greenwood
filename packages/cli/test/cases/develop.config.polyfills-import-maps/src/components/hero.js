const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
    text-align: center;
    margin-bottom: 40px;
  }

  :host h2 {
    font-size: 3em;
  }

  :host button {
    display: inline-block;
    background-color: var(--color-primary);
    color: var(--color-white);
    font-size: 1.5em;
    padding: 14px;
    border-radius: 10px;
    cursor: pointer;
  }
  </style>
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
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    this.shadowRoot.querySelectorAll('button')
      .forEach(button => {
        button.addEventListener('click', () => this.clickButton(button));
      });
  }
}

customElements.define('app-hero', HeroBanner);
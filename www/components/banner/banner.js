import { css, html, LitElement, unsafeCSS } from 'lit';
import bannerCss from './banner.css?type=css';
import buttonCss from './button.css?type=css';
import './eve-button.js';
import '@evergreen-wc/eve-container';

class Banner extends LitElement {
  constructor() {
    super();

    this.currentProjectIndex = 0;
    this.animateState = 'on';
    this.projectTypes = [
      'blog',
      'portfolio',
      'website',
      'web app',
      'marketing site',
      'small business'
    ];
  }

  static get styles() {
    return css`
      ${unsafeCSS(bannerCss)}
    `;
  }

  cycleProjectTypes() {
    this.currentProjectIndex = this.currentProjectIndex += 1;

    if (this.currentProjectIndex >= this.projectTypes.length) {
      this.currentProjectIndex = 0;
    }
  }

  firstUpdated() {
    setInterval(() => {
      this.animateState = 'off';
      this.update();

      setTimeout(() => {
        this.cycleProjectTypes();
        this.animateState = 'on';
        this.update();
      }, 500);
    }, 5000);
  }

  render() {
    const currentProjectType = this.projectTypes[this.currentProjectIndex];

    return html`
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <img
              src="/assets/greenwood-logo-300w.webp"
              alt="Greenwood Logo"
              srcset="/assets/greenwood-logo-300w.webp 350w,
                      /assets/greenwood-logo-500w.webp 500w,
                      /assets/greenwood-logo-750w.webp 750w,
                      /assets/greenwood-logo-1000w.webp 1000w,
                      /assets/greenwood-logo-1500w.webp 1500w"/>
            
            <h3>Your full stack <span class="emphasis-text">workbench for the web</span>.  Ready to help you build your next. . . <span class="${this.animateState}">${currentProjectType}.</span></h3>

            <eve-button size="md" href="/getting-started/" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('app-banner', Banner);
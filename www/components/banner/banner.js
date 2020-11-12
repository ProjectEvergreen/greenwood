import { css, html, LitElement, unsafeCSS } from 'lit-element';
import bannerCss from './banner.css';
import buttonCss from './button.css';
// TODO import greenwoodLogo300 from '../../assets/greenwood-logo-300w.png';
// import greenwoodLogo500 from '../../assets/greenwood-logo-500w.png';
// import greenwoodLogo750 from '../../assets/greenwood-logo-750w.png';
// import greenwoodLogo1000 from '../../assets/greenwood-logo-1000w.png';
// import greenwoodLogo1500 from '../../assets/greenwood-logo-1500w.png';
import '@evergreen-wc/eve-button';
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
      ${unsafeCSS(buttonCss)}
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
      }, 1000);
    }, 3000);
  }

  render() {
    const currentProjectType = this.projectTypes[this.currentProjectIndex];

    return html`
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <img 
              src="../../assets/greenwood-logo-300w.png" 
              alt="Greenwood Logo"
              srcset="../../assets/greenwood-logo-300w.png 1x,
                      ../../assets/greenwood-logo-500w.png 2x,
                      ../../assets/greenwood-logo-750w.png 3x,
                      ../../assets/greenwood-logo-1000w.png 4x,
                      ../../assets/greenwood-logo-1500w.png 5x"/>

            <h3>The static site generator for your. . . <br /><span class="${this.animateState}">${currentProjectType}.</span></h3>

            <eve-button size="md" href="/getting-started/" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('app-banner', Banner);
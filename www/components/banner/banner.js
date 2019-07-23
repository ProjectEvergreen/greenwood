import { html, LitElement } from 'lit-element';
import bannerCss from './banner.css';
import buttonCss from './button.css';
import greenwoodLogo from '../../assets/greenwood-logo.png';
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
      <style>
        ${bannerCss}
      </style>
      
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <img src="${greenwoodLogo}" alt="Greenwood Logo"/>
            
            <h3>The static site generator for your. . . <span class="${this.animateState}">${currentProjectType}.</span></h3>
            
            <eve-button size="md" href="/getting-started" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('eve-banner', Banner);
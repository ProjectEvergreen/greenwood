import { html, LitElement } from 'lit-element';
import bannerCss from './banner.css';
import buttonCss from './button.css';
import greenwoodLogo300 from '../../assets/greenwood-logo-300w.png';
import greenwoodLogo500 from '../../assets/greenwood-logo-500w.png';
import greenwoodLogo750 from '../../assets/greenwood-logo-750w.png';
import greenwoodLogo1000 from '../../assets/greenwood-logo-1000w.png';
import greenwoodLogo1500 from '../../assets/greenwood-logo-1500w.png';
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
            <img 
              src="${greenwoodLogo300}" 
              alt="Greenwood Logo"
              srcset="${greenwoodLogo300} 1x,
                      ${greenwoodLogo500} 2x,
                      ${greenwoodLogo750} 3x,
                      ${greenwoodLogo1000} 4x,
                      ${greenwoodLogo1500} 5x"/>

            <h3>The static site generator for your. . . <br /><span class="${this.animateState}">${currentProjectType}.</span></h3>

            <eve-button size="md" href="/getting-started" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('eve-banner', Banner);

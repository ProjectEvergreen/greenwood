import { html, LitElement } from 'lit-element';
import bannerCss from './banner.css';
import buttonCss from './button.css';
import '@evergreen-wc/eve-button';
import '@evergreen-wc/eve-container';

class Banner extends LitElement {

  constructor() {
    super();
    this.currentProjectIndex = 0;
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
    console.log('cycleProjectTypes', this.projectTypes);
    this.currentProjectIndex = this.currentProjectIndex += 1;

    if (this.currentProjectIndex >= this.projectTypes.length) {
      this.currentProjectIndex = 0;
    }
  }

  firstUpdated() {
    setInterval(() => {
      this.cycleProjectTypes();
      this.update();
    }, 3000);
  }

  render() {
    const project = this.projectTypes[this.currentProjectIndex];

    return html`
      <style>
        ${bannerCss}
      </style>
      
      <div class='banner'>
        <eve-container>
          <div class='content'>
            <h1>Welcome to Greenwood!</h1>
            <hr />
            <h3>A modern and easy to use static site generator for your. . . ${project}.</h3>
            <eve-button size="md" href="/about" style="${buttonCss}">Get Started</eve-button>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('eve-banner', Banner);
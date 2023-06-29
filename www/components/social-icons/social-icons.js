import { css, html, LitElement, unsafeCSS } from 'lit';
import socialCss from './social-icons.css?type=css';
import githubIcon from '../icons/github-icon.js';
import twitterIcon from '../icons/twitter-icon.js';
import slackIcon from '../icons/slack-icon.js';

class SocialIcons extends LitElement {

  static get styles() {
    return css`
      ${unsafeCSS(socialCss)}
    `;
  }

  render() {
    const socialUrls = {
      github: 'https://github.com/ProjectEvergreen/greenwood',
      slack: 'https://join.slack.com/t/thegreenhouseio/shared_invite/enQtMzcyMzE2Mjk1MjgwLTU5YmM1MDJiMTg0ODk4MjA4NzUwNWFmZmMxNDY5MTcwM2I0MjYxN2VhOTEwNDU2YWQwOWQzZmY1YzY4MWRlOGI',
      twitter: 'https://twitter.com/PrjEvergreen'
    };

    return html`
      <a class="icons"
        href="${socialUrls.github}"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="open github page"
      >${githubIcon}</a>

      <a href="${socialUrls.slack}"
        class="icons slack-icon"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="slack"
      >${slackIcon}</a>

      <a href="${socialUrls.twitter}"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="open twitter page"
      >${twitterIcon}</a>
    `;
  }
}

customElements.define('app-social-icons', SocialIcons);
import { html, LitElement } from 'lit-element';
import css from './social-icons.css';
import githubIcon from '../icons/github-icon';
import twitterIcon from '../icons/twitter-icon';
import slackIcon from '../icons/slack-icon';

class SocialIcons extends LitElement {
  render() {
    return html`
    <style>
      ${css}
    </style>
        <a href="https://github.com/ProjectEvergreen" target="_blank" rel=”noreferrer noopener” aria-label="open github page">${githubIcon}</a>
        <a href="https://join.slack.com/t/thegreenhouseio/shared_invite/enQtMzcyMzE2Mjk1MjgwLTU5YmM1MDJiMTg0ODk4MjA4NzUwNWFmZmMxNDY5MTcwM2I0MjYxN2VhOTEwNDU2YWQwOWQzZmY1YzY4MWRlOGI" id="slack-icon" target="_blank" rel=”noreferrer noopener” aria-label="open slack page">${slackIcon}</a>
        <a href="https://twitter.com/PrjEvergreen" target="_blank" rel=”noreferrer noopener” aria-label="open twitter page">${twitterIcon}</a>
    `;
  }
}

customElements.define('eve-socialicons', SocialIcons);

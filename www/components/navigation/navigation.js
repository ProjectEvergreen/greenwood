import { html, LitElement } from 'lit-element';
import navCss from './navigation.css';

class NavigationComponent extends LitElement {
  render() {
    return html`
    <style>
      ${navCss}
    </style>
      <nav class="navigation">
        <ul>
          <li><h4><a href="/about">About</a></h4></li>
          <li><h4><a href="/guides">Guides</a></h4></li>
          <li><h4><a href="/projects">Projects</a></h4></li>
        </ul>
      </nav>
    `;
  }
}

customElements.define('eve-navigation', NavigationComponent);
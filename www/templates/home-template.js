import { html, LitElement } from 'lit-element';
import '../components/banner/banner';
import '@evergreen-wc/eve-container';
import '../styles/theme.css';
import homeCss from '../styles/home.css';

class HomeTemplate extends LitElement {

  render() {
    return html`
      <style>
        ${homeCss}
      </style>

      <script>
        function inlineScript() {
          alert('inline script running even in SSG mode, loading no external JS! 🎉');
        }
      </script>

      <eve-banner></eve-banner>

      <button onclick="inlineScript()">For a good time, click here.</button>
      
      <div class='gwd-content-wrapper'>
        <eve-container fluid>
          <div class='gwd-page-template gwd-content'>
            <entry></entry>
          </div>
        </eve-container>
      </div>
    `;
  }
}

customElements.define('page-template', HomeTemplate);
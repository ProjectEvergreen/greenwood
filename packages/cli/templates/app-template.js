import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import store from './store.js';
import '../pages/index';
import './list';

connectRouter(store);

class AppComponent extends LitElement {
  render() {
    return html`
        <lit-route path="/" component="home-page"></lit-route>
        MYROUTES
    `;
  }
}

customElements.define('eve-app', AppComponent);

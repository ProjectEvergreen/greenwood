import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers';
import thunk from 'redux-thunk';

const store = createStore((state) => state,
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

connectRouter(store);

class AppHome extends LitElement {
  render() {
    return html`<h1>Home</h1>`;
  }
}
customElements.define('app-home', AppHome);

class AppAbout extends LitElement {
  render() {
    return html`<h1>About</h1>`;
  }
}
customElements.define('app-about', AppAbout);

class MyApp extends LitElement {
  render() {
    return html`
      <div class="app-content">
        <lit-route path="/" component="app-home"></lit-route>
        <lit-route path="/about" component="app-about"></lit-route>
      </div>
    `;
  }
}

customElements.define('my-app', MyApp);
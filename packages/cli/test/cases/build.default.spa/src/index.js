import { html, LitElement } from 'lit';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers';
import thunk from 'redux-thunk';

const store = createStore((state) => state,
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

connectRouter(store);

class MyApp extends LitElement {
  render() {
    return html`
      <div class="app-content">
        <lit-route 
          path="/" 
          component="app-route-home"
          .resolve="${() => import('./routes/home.js')}"
        ></lit-route>
        <lit-route 
          path="/about" 
          component="app-route-about"
          .resolve="${() => import('./routes/about.js')}"
        ></lit-route>
      </div>
    `;
  }
}

customElements.define('my-app', MyApp);
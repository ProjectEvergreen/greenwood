import { html, LitElement } from 'lit-element';
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
          component="app-home"
          .resolve="${() => { console.log('lazy load home'); return import('./routes/home.js'); }}"
        ></lit-route>
        <lit-route 
          path="/about" 
          component="app-about"
          .resolve="${() => { console.log('lazy load about'); return import('./routes/about.js'); }}"
        ></lit-route>
      </div>
    `;
  }
}

customElements.define('my-app', MyApp);
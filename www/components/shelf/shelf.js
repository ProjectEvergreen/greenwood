import { html, LitElement } from 'lit-element';
import css from './shelf.css';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';
import { navigate } from 'lit-redux-router';

const chevronRt = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
<path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505
256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373
24.568.001 33.941z"/></svg>`;

const chevronDwn = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
<path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224
284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373
9.372-24.569 9.372-33.942 0z"/></svg>`;

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;
// eslint-disable-next-line
const store = createStore(
  (state, action) => state, // eslint-disable-line
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));

class shelf extends LitElement {

  static get properties() {
    return {
      shelfList: {
        type: Array
      }
    };
  }

  constructor() {
    super();
    this.selectedIndex = '';
    this.selectedSubIndex = '';

  }

  connectedCallback() {
    super.connectedCallback();
    this.collapseAll();
    this.expandRoute(window.location.pathname);
  }

  goTo(path) {
    location.hash = path;
    store.dispatch(navigate(path));
  }

  expandRoute(path) {
    // find list item containing current window.location.pathname
    let routeShelfListIndex = this.shelfList.findIndex(list => {
      return list.path === path;
    });

    if (routeShelfListIndex > -1) {
      this.shelfList[routeShelfListIndex].selected = true;
      // force re-render
      this.requestUpdate();
    }
  }

  collapseAll() {
    for (let i = 0; i < this.shelfList.length; i = i + 1) {
      this.shelfList[i].selected = false;
    }
  }

  toggleSelectedItem() {
    let selectedShelfListIndex = this.shelfList.findIndex(list => {
      return list.index === this.selected;
    });

    this.shelfList[selectedShelfListIndex].selected = !this.shelfList[selectedShelfListIndex].selected;
  }

  setSelectedItem(evt) {
    const previousSelected = this.selected;

    this.selected = parseInt(evt.target.id.substring(6, evt.target.id.length), 10);

    if (this.selected === previousSelected) {
      this.toggleSelectedItem();
      this.selected = '';
      return;
    }

    this.toggleSelectedItem();
  }

  handleClick(evt) {
    // collapse all other items
    this.collapseAll();
    // set selected to index
    this.setSelectedItem(evt);
    // force re-render
    this.requestUpdate();
  }

  renderList() {

    /* eslint-disable */
    const renderListItems = (list) => {
      return html`
        <ul>
          ${list.items.map(item => {
            return html`
              <li id="index_${item.index}" class="${list.selected ? '' : 'hidden'}"><a @click=${()=> this.goTo(`#${item.id}`)}">${item.name}</a></li>
            `;
          })}
        </ul>`;
    }
    /* eslint-enable */

    return this.shelfList.map((list) => {
      let id = `index_${list.index}`;
      let chevron = list.selected === true ? chevronDwn : chevronRt;

      return html`
        <li class="list-wrap">
          <a href="${list.path}" @click="${this.handleClick}"><h2 id="${id}">${list.name} <span>${chevron}</span></h2></a>
          <hr>
          ${renderListItems(list)}
        </li>
      `;
    });

  }

  render() {
    return html`
    <style>
      ${css}
    </style>
      <div>
        <ul>
          ${this.renderList()}
        </ul>
      </div>
    `;
  }
}

customElements.define('eve-shelf', shelf);
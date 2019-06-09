import { html, LitElement } from 'lit-element';
import css from './shelf.css';

const chevronRt = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
<path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 
256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 
24.568.001 33.941z"/></svg>`;

const chevronDwn = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
<path d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 
284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 
9.372-24.569 9.372-33.942 0z"/></svg>`;

let shelfList;

class shelf extends LitElement {

  constructor() {
    super();
    this.selectedIndex = '';
    this.selectedSubIndex = '';
  }

  connectedCallback() {
    super.connectedCallback();

    // check for querystring 
    // display selected item list in shelf
    console.log(window.location);
    const path = window.location.pathname;

    if (path.substring(0, 5) === '/docs') {
      shelfList = require('./document-list.json');
    } else {
      shelfList = require('./getting-started-list.json');
    }

    console.log(shelfList);
    this.collapseAll();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  collapseAll() {
    for (let i = 0; i < shelfList.length; i = i + 1) {
      shelfList[i].selected = false;
    }
  }

  toggleSelectedItem() {
    let selectedShelfListIndex = shelfList.findIndex(list => {
      return list.index === this.selected;
    });

    shelfList[selectedShelfListIndex].selected = !shelfList[selectedShelfListIndex].selected;
  }

  setSelectedItem(evt) {
    const previousSelected = this.selected;

    this.selected = parseInt(evt.target.id.substring(6, evt.target.id.length), 10);

    console.log(this.selected);

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
              <li id="index_${item.index}" class="${list.selected ? '' : 'hidden'}">${item.name}</li>
            `;
          })}
        </ul>`;
    }
    /* eslint-enable */

    return shelfList.map((list) => {
      let id = `index_${list.index}`;
      let chevron = list.selected === true ? chevronDwn : chevronRt;

      return html`
        <li class="list-wrap">
          <a href="#" @click="${this.handleClick}"><h2 id="${id}">${list.name} <span>${chevron}</span></h2></a>
          <hr>
          ${renderListItems(list)}
        </li>
      `;
    });
    
  }

  render() {
    console.log('rendered');
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
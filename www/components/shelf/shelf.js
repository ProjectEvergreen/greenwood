import { LitElement, html } from 'lit-element';
import client from '@greenwood/cli/data/client';
import MenuQuery from '@greenwood/cli/data/queries/menu';
import css from './shelf.css';
import chevronRt from '../icons/chevron-right/chevron-right';
import chevronDwn from '../icons/chevron-down/chevron-down';

class Shelf extends LitElement {

  static get properties() {
    return {
      page: {
        type: String
      }
    };
  }

  constructor() {
    super();
    this.selectedIndex = '';
    this.shelfList = [];
    this.page = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.collapseAll();
    this.expandRoute(window.location.pathname);
  }

  async setupShelf(page) {
    if (page && page !== '' && page !== '/') {
      const response = await client.query({
        query: MenuQuery,
        variables: {
          menu: 'side',
          route: window.location.pathname
        }
      });

      console.log('shelf =>', response.data.menu.children);
      this.shelfList = response.data.menu.children;
    }
  }

  goTo(path) {
    location.hash = path;
    window.history.pushState({}, '', path);
  }

  expandRoute(path) {
    // find list item containing current window.location.pathname
    let routeShelfListIndex = this.shelfList.findIndex(list => {
      return list.path.indexOf(path) >= 0;
    });

    if (routeShelfListIndex > -1) {
      this.shelfList[routeShelfListIndex].selected = true;
      this.selectedIndex = routeShelfListIndex;
      // force re-render
      this.requestUpdate();
    }
  }

  collapseAll() {
    this.shelfList = this.shelfList.map(item => {
      item.selected = false;
      return item;
    });
  }

  toggleSelectedItem() {
    let selectedShelfListIndex = this.shelfList.findIndex((list, index) => {
      return index === this.selectedIndex;
    });

    if (selectedShelfListIndex > -1) {
      this.shelfList[selectedShelfListIndex].selected = !this.shelfList[selectedShelfListIndex].selected;
    }
  }

  setSelectedItem(evt) {
    const previousSelected = this.selectedIndex;

    this.selectedIndex = parseInt(evt.target.id.substring(6, evt.target.id.length), 10);

    if (this.selectedIndex === previousSelected) {
      this.selectedIndex = '';
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

    /* eslint-disable indent */
    const renderListItems = (list) => {
      let listItems = '';

      if (list.items && list.items.length > 0) {
        listItems = html`
          <ul>
            ${list.items.map((item, index) => {
              return html`
                <li id="index_${index}" class="${list.selected ? '' : 'hidden'}"><a @click=${()=> this.goTo(`#${item.id}`)}">${item.name}</a></li>
              `;
            })}
          </ul>
        `;
      }

      return listItems;
    };
    /* eslint-enable */

    return this.shelfList.map((list, index) => {
      let id = `index_${index}`;
      let chevron = list.items && list.items.length > 0
        ? list.selected === true ? chevronDwn : chevronRt
        : '';

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
    const { page } = this;

    this.setupShelf(page);

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

customElements.define('eve-shelf', Shelf);
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
    this.page = '';
    this.selectedIndex = '';
    this.shelfList = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    this.collapseAll();
  }

  goTo(path) {
    location.hash = path;
    window.history.pushState({}, '', path);
  }

  expandRoute(path) {
    console.log('ENTER expand route - path (winwdow.location.pathname)', path);
    let routeShelfListIndex = this.shelfList.findIndex(list => {
      let expRoute = new RegExp(`^${path}$`);
      return expRoute.test(list.item.link);
    });
    console.log('expand route - routeShelfListIndex', routeShelfListIndex);
    if (routeShelfListIndex > -1) {
      this.shelfList[routeShelfListIndex].selected = true;
      this.selectedIndex = routeShelfListIndex;
    }
    console.log('expand route - selectedIndex', this.selectedIndex);
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

  async fetchShelfData() {
    console.log('ENTER fetchShelfData');
    // await client.query({
    //   query: MenuQuery,
    //   variables: {
    //     name: 'side',
    //     route: `/${this.page}/`,
    //     order: 'index_asc'
    //   }
    // });

    return await client.query({
      query: MenuQuery,
      variables: {
        name: 'side',
        route: `/${this.page}/`,
        order: 'index_asc'
      }
    });
  }

  async updated(changedProperties) {
    console.log('ENTER updated - changedProperties', changedProperties);
    console.log('updated - this.page', this.page);
    if (changedProperties.has('page') && this.page !== '' && this.page !== '/') {
      const response = await this.fetchShelfData();
      this.shelfList = response.data.menu.children;
      console.log('fetchShelfData - ', this.shelfList);

      this.expandRoute(window.location.pathname);
      this.requestUpdate();
    }
  }

  renderList() {
    /* eslint-disable indent */
    const renderListItems = (list, selected) => {
      let listItems = '';

      if (list && list.length > 0) {
        listItems = html`
          <ul>
            ${list.map(({ item }, index) => {
              return html`
                <li id="index_${index}" class="${selected ? '' : 'hidden'}"><a @click=${()=> this.goTo(`${item.link}`)}">${item.label}</a></li>
              `;
            })}
          </ul>
        `;
      }

      return listItems;
    };

    /* eslint-enable */
    return this.shelfList.map(({ item, children, selected }, index) => {
      let id = `index_${index}`;
      let chevron = children && children.length > 0
        ? selected === true ? chevronDwn : chevronRt
        : '';

      return html`
        <li class="list-wrap">
          <a href="${item.link}" @click="${this.handleClick}"><h2 id="${id}">${item.label} <span>${chevron}</span></h2></a>
          <hr>
          ${renderListItems(children, selected)}
        </li>
      `;
    });
  }

  render() {
    console.log('ENTER shelf render');
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
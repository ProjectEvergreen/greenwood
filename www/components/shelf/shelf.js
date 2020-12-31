import { css, html, LitElement, unsafeCSS } from 'lit-element';
// import client from '@greenwood/cli/data/client';
// import MenuQuery from '@greenwood/cli/data/queries/menu';
import shelfCss from './shelf.css';
import chevronRt from '../icons/chevron-right.js';
import chevronDwn from '../icons/chevron-down.js';

class Shelf extends LitElement {

  static get properties() {
    return {
      page: {
        type: String
      }
    };
  }

  static get styles() {
    return css`
      ${unsafeCSS(shelfCss)}
    `;
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
    let routeShelfListIndex = this.shelfList.findIndex(item => {
      let expRoute = new RegExp(`^${path}$`);
      return expRoute.test(item.route);
    });

    if (routeShelfListIndex > -1) {
      this.shelfList[routeShelfListIndex].selected = true;
      this.selectedIndex = routeShelfListIndex;
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

  handleShelfClick(evt) {
    // collapse all other items
    this.collapseAll();
    // set selected to index
    this.setSelectedItem(evt);
    // force re-render
    this.requestUpdate();
  }

  async fetchShelfData() {
    console.log('fetchShelfData!!!', this.page);
    return fetch('/graph.json')
      .then(res => res.json())
      .then(data => {
        return data.filter(page => {
          if (page.data.menu && page.data.menu === 'side' && page.route.indexOf(`/${this.page}`) === 0) {
            page.label = `${page.label.charAt(0).toUpperCase()}${page.label.slice(1)}`.replace('-', ' ');
            page.children = [];

            page.data.tableOfContents.forEach(({ content, slug }) => {
              page.children.push({
                label: content,
                route: `#${slug}`
              });
            });

            return page;
          }
        }).sort((a, b) => {
          return a.data.index < b.data.index ? -1 : 1;
        });
      });
    // return await client.query({
    //   query: MenuQuery,
    //   variables: {
    //     name: 'side',
    //     route: `/${this.page}/`,
    //     order: 'index_asc'
    //   }
    // });
  }

  async updated(changedProperties) {
    if (changedProperties.has('page') && this.page !== '' && this.page !== '/') {
      // const response = await this.fetchShelfData();
      // this.shelfList = response.data.menu.children;
      this.shelfList = await this.fetchShelfData();
      // console.debug('this.shelfList', this.shelfList);

      this.expandRoute(window.location.pathname);
      this.requestUpdate();
    }
  }

  handleSubItemSelect(mainRoute, itemRoute) {
    // check if we're on the same page as subitem anchor
    if (window.location.pathname.substr(0, window.location.pathname.length - 1) !== mainRoute) {
      window.location.href = mainRoute + itemRoute;
    } else {
      this.goTo(`${item.route}`);
    }
  }

  renderList() {
    /* eslint-disable indent */
    const renderListItems = (mainRoute, list, selected) => {
      let listItems = '';

      if (list && list.length > 0) {
        listItems = html`
          <ul>
            ${list.map((item) => {
              return html`
                <li class="${selected ? '' : 'hidden'}">
                  <a @click=${() => this.handleSubItemSelect(mainRoute, item.route)}>${item.label}</a>
                </li>
              `;
            })}
          </ul>
        `;
      }

      return listItems;
    };

    /* eslint-enable */
    return this.shelfList.map((item, index) => {
      let id = `index_${index}`;
      let chevron = item.children && item.children.length > 0
        ? item.selected === true ? chevronDwn : chevronRt
        : '';

      return html`
        <li class="list-wrap">
          <div>
            <a href="${item.route}">${item.label}</a>
            <a id="${id}" @click="${this.handleShelfClick}"><span class="pointer">${chevron}</span></a>
          </div>

          <hr/>
          
          ${renderListItems(item.route, item.children, item.selected)}
        </li>
      `;
    });
  }

  render() {
    return html`
      <div>
        <ul>
          ${this.renderList()}
        </ul>
      </div>
    `;
  }
}

customElements.define('app-shelf', Shelf);
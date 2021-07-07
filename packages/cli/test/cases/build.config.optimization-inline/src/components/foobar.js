class Foobar extends HTMLElement {

  constructor() {
    super();
    this.list = [];
  }

  find(path) {
    this.list.findIndex(item => {
      return new RegExp(`^${path}$`).test(item.route);
    });
  }
}

export { Foobar };
export default class AboutPage extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return <h1>About Page</h1>;
  }
}

export const prerender = false;

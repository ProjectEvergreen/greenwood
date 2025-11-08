export default class FirstPostsPage extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return <h2>First Post Page</h2>;
  }
}

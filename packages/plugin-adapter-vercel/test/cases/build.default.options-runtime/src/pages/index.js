export default class IndexPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<h1>Just here causing trouble! :D</h1>';
  }
}
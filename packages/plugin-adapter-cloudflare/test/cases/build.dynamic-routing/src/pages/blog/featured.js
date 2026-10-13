export default class FeaturedPost extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h1>Featured post</h1>";
  }
}

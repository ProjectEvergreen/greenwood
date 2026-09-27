export default class BlogPostPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h1>First post</h1>";
  }
}

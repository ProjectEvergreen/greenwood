export default class PostPage extends HTMLElement {
  constructor({ request }) {
    super();
    this.postId = new URL(request.url).searchParams.get("id");
  }

  connectedCallback() {
    this.innerHTML = `<h1>Post ID: ${this.postId}</h1>`;
  }
}

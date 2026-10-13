export default class UsersPage extends HTMLElement {
  postId;

  constructor({ request }) {
    super();
    this.postId = new URL(request.url).searchParams.get("id");
  }

  connectedCallback() {
    this.innerHTML = `<h1>User ID: ${this.postId}</h1>`;
  }
}

export default class PostPage extends HTMLElement {
  constructor(request) {
    super();

    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
    this.postId = params.get('id');
  }

  async connectedCallback() {
    const { postId } = this;
    const post = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`).then(resp => resp.json());
    const { id, title, body } = post;

    this.innerHTML = `
      <h1>Fetched Post ID: ${id}</h1>
      <h2>${title}</h2>
      <p>${body}</p>
    `;
  }
}
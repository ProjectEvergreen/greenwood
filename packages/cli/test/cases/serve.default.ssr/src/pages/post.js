export default class PostPage extends HTMLElement {
  constructor({ post = {} }) {
    super();
    this.post = post;
  }

  async connectedCallback() {
    const { id, title, body } = this.post;

    this.innerHTML = `
      <h1>Fetched Post ID: ${id}</h1>
      <h2>${title}</h2>
      <p>${body}</p>
    `;
  }
}

export async function loader(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const postId = params.get('id');
  const post = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`).then(resp => resp.json());

  return {
    post
  };
}
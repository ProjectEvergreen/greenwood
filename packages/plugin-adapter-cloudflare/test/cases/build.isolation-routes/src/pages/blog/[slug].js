export const isolation = true;

export default class BlogPage extends HTMLElement {
  constructor({ params }) {
    super();
    this.innerHTML = `<h1>Blog: ${params.slug}</h1>`;
  }
}

export default class BlogPostPage extends HTMLElement {
  #slug;

  constructor({ params }) {
    super();
    this.#slug = params?.slug;
  }

  connectedCallback() {
    this.innerHTML = `
      <body>
        <h1>${this.#slug}</h1>
      </body>
    `;
  }
}

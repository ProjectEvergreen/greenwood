export default class BlogPostPage extends HTMLElement {
  #slug;

  constructor({ props }) {
    super();
    this.#slug = props?.slug;
  }

  connectedCallback() {
    this.innerHTML = `
      <body>
        <h1>${this.#slug}</h1>
      </body>
    `;
  }
}

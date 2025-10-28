type BlogPostPageProps = {
  props: {
    slug: string;
  };
};

export default class BlogPostPage extends HTMLElement {
  #slug: string;

  constructor({ props }: BlogPostPageProps) {
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

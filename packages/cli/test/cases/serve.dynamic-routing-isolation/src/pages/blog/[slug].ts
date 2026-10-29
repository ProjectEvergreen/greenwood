type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export default class BlogPostPage extends HTMLElement {
  #slug: string;

  constructor({ params }: BlogPostPageProps) {
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

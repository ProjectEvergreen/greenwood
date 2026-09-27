export default class StoryPage extends HTMLElement {
  slug: string;

  constructor({ params }: { params: { slug: string } }) {
    super();
    this.slug = params.slug;
  }

  connectedCallback() {
    this.innerHTML = `<h1>Story: ${this.slug}</h1>`;
  }
}

export default class StoryPage extends HTMLElement {
  constructor({ params }) {
    super();
    this.slug = params.slug;
  }

  connectedCallback() {
    this.innerHTML = `<h1>Story: ${this.slug}</h1>`;
  }
}

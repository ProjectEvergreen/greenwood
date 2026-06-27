export default class EventDetailPage extends HTMLElement {
  #title;

  constructor({ params }) {
    super();
    this.#title = params?.title ?? "No Title";
  }

  async connectedCallback() {
    this.innerHTML = `
      <h1>${this.#title.toUpperCase().replace(/-/g, " ")}</h1>
    `;
  }
}

export const prerender = false;

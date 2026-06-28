export default class EventDetailPage extends HTMLElement {
  #title;

  constructor({ params }) {
    super();
    this.#title = params?.title ?? "No Title";
  }

  async connectedCallback() {
    this.innerHTML = `
      <h2>${this.#title.toUpperCase().replace(/-/g, " ")}</h2>
    `;
  }
}

export const prerender = false;

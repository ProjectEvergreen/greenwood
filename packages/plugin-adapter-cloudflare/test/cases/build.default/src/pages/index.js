export default class HomePage extends HTMLElement {
  message;

  constructor({ request }) {
    super();
    this.message = new URL(request.url).searchParams.get("message");
  }

  connectedCallback() {
    this.innerHTML = `<h1>Home: ${this.message}</h1>`;
  }
}

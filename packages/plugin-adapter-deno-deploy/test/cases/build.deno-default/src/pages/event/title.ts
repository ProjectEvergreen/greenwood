export const prerender = true;

export default class EventPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h1>Prerendered event</h1>";
  }
}

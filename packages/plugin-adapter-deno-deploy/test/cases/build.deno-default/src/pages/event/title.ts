export const staticExport = true;

export default class EventPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h1>Static event</h1>";
  }
}

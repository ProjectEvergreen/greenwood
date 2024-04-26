import '../components/card/card.js';

export default class GreetingPage extends HTMLElement {

  async connectedCallback() {
    this.innerHTML = `
      <app-card></app-card>
    `;
  }
}
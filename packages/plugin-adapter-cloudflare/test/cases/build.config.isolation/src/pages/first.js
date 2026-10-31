import { registerCard } from "../components/card.js";

export default class FirstPage extends HTMLElement {
  connectedCallback() {
    registerCard();
    this.innerHTML = "<h1>First page</h1><app-cloudflare-isolated></app-cloudflare-isolated>";
  }
}

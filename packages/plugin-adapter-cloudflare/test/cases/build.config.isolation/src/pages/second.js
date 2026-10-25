import { registerCard } from "../components/card.js";

export default class SecondPage extends HTMLElement {
  connectedCallback() {
    registerCard();
    this.innerHTML = "<h1>Second page</h1><app-cloudflare-isolated></app-cloudflare-isolated>";
  }
}

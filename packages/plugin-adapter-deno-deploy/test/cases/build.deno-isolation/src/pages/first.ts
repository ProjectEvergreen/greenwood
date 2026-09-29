import { registerCard } from "../components/card.ts";

export default class FirstPage extends HTMLElement {
  connectedCallback() {
    registerCard();
    this.innerHTML = "<h1>First page</h1><app-shared></app-shared>";
  }
}

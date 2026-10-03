import { registerCard } from "../components/card.ts";

export default class SecondPage extends HTMLElement {
  connectedCallback() {
    registerCard();
    this.innerHTML = "<h1>Second page</h1><app-shared></app-shared>";
  }
}

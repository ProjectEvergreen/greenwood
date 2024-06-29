import '../components/greeting.ts';

export default class ContactPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <h1>Welcome to our Home page!</h1>
      <x-greeting name="About Page"></x-greeting>
    `;
  }
}
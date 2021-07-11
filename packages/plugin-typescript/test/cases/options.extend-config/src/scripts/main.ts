import { html, css, LitElement, customElement, property } from 'lit-element';

@customElement('app-greeting')
export class GreetingComponent extends LitElement {
  static styles = css`p { color: blue }`;

  @property()
  name = 'Somebody';

  render() {
    const greeting: Greeting = {
      message: html`<p>Hello, ${this.name}!</p>`
    };

    return greeting.message;
  }
}
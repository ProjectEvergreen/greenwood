import { html, css, LitElement } from 'lit-element';
import { customElement, property } from 'lit/decorators.js';
import { TemplateResult } from 'lit-html';

@customElement('app-greeting')
export class GreetingComponent extends LitElement {
  static styles = css`p { color: blue }`;

  @property()
    name = 'Somebody';

  render(): TemplateResult {
    const greeting: TemplateResult = html`<p>Hello, ${this.name}!</p>`;

    return greeting;
  }
}
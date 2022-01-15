import { html } from 'lit';

const initialData = {
  name: 'World'
};

const helloTemplate = (name = initialData.name) => html`<h1>Hello ${name}!</h1>`;

export { helloTemplate, initialData };
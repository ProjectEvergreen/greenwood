import { html } from "lit";

export function getBody(compilation, page, request, params) {
  return html`<h1>Artist: ${params.name}</h1>`;
}

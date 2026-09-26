import { getRuntimeInfo } from "../services/runtime.ts";

export function getFrontmatter() {
  return {
    title: "Deno Runtime",
  };
}

export default class RuntimePage extends HTMLElement {
  connectedCallback() {
    const runtimeInfo = JSON.stringify(getRuntimeInfo());

    this.innerHTML = `
      <h1>Deno Runtime (SSR)</h1>
      <pre data-runtime-info>${runtimeInfo}</pre>
    `;
  }
}

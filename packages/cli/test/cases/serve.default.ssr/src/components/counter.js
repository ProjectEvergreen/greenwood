const template = document.createElement("template");

template.innerHTML = `
  <style>
    :host {
      color: blue;
    }
  </style>
  <h3>My Counter</h3>
  <button id="dec">-</button>
  <span id="count"></span>
  <button id="inc">+</button>
`;

class MyCounter extends HTMLElement {
  static staticProperty = "foo";
  #count;

  constructor() {
    super();
    this.#count = 0;
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.getElementById("inc").onclick = () => this.inc();
    this.shadowRoot.getElementById("dec").onclick = () => this.dec();
    this.#count = this.getAttribute("count") ?? this.#count;
    this.update();
  }

  inc() {
    this.update(++this.#count);
  }

  dec() {
    this.update(--this.#count);
  }

  update(count) {
    this.shadowRoot.getElementById("count").innerHTML = count || this.#count;
  }
}

customElements.define("x-counter", MyCounter);

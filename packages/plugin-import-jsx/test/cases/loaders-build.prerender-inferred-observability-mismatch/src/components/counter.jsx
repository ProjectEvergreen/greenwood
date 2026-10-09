export const inferredObservability = true;

export default class Counter extends HTMLElement {
  count;
  parity;
  isLarge;

  constructor() {
    super();
    this.count = new Signal.State(0);
    this.parity = new Signal.Computed(() => (this.count.get() % 2 === 0 ? "even" : "odd"));
    this.isLarge = new Signal.Computed(() =>
      this.count.get() >= 100 ? "Wow!!!" : "Keep Going...",
    );
  }

  // Shadow DOM
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({
        mode: "open",
      });
      this.render();
    }
  }

  increment() {
    this.count.set(this.count.get() + 1);
  }

  decrement() {
    this.count.set(this.count.get() - 1);
  }

  double() {
    this.count.set(this.count.get() * 2);
  }

  render() {
    const { count, parity, isLarge } = this;

    return (
      <div>
        <button onclick={this.increment}>Increment (+)</button>
        <button onclick={this.decrement}>Decrement (-)</button>
        <button onclick={this.double}>Double (++)</button>
        <span class={parity.get()}>
          The count is {count.get()} ({parity.get()})
        </span>
        <p>({isLarge.get()})</p>
      </div>
    );
  }
}

customElements.define("wcc-counter", Counter);

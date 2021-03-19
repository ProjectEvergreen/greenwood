class Counter {
  #x = 0;

  #logClicked() {
    console.debug('private variable "x" was clicked. is now =>', this.#x)
  }

  clicked() {
    this.#x++;
    this.#logClicked();
  }
}

const counter = new Counter();

setInterval(() => {
  counter.clicked();
}, 1000);
import init from "./wasm_hello_world.js";

document.addEventListener("DOMContentLoaded", async () => {
  const helloWorld = await init(new URL("./wasm_hello_world_bg.wasm", import.meta.url).href);
  const form = document.querySelector("#add-form");
  const output = document.querySelector("#output");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const one = parseInt(formData.get("number-one"), 10);
    const two = parseInt(formData.get("number-two"), 10);
    const sum = helloWorld.add(one, two);

    output.textContent = `Result: ${one} + ${two} = ${sum}`;
  });
});

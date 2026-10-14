const wasmUrl = new URL("./add.wasm", import.meta.url);
const { instance } = await WebAssembly.instantiateStreaming(fetch(wasmUrl));

document.getElementById("out").textContent = `add(2,3)=${instance.exports.add(2, 3)}`;

import * as wasm from "./add.wasm";

document.getElementById("out").textContent = `add(2,3)=${wasm.add(2, 3)}`;

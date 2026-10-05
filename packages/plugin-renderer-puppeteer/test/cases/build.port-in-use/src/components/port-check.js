const response = await fetch("/___graph.json", {
  headers: { "X-CONTENT-KEY": "graph" },
});
const content = await response.json();

document.querySelector("#server-origin").textContent = globalThis.location.origin;
document.querySelector("#content-port").textContent = globalThis.__CONTENT_OPTIONS__.PORT;
document.querySelector("#content-count").textContent = content.length;

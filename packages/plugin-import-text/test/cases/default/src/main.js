import stylesCss from "./styles.css?type=text";

document.getElementsByTagName("span")[0].innerHTML = `import from styles.css: ${stylesCss}`;

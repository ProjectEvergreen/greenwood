import stylesCss from './styles.css?type=raw';

document.getElementsByTagName('span')[0].innerHTML = `import from styles.css: ${stylesCss}`;
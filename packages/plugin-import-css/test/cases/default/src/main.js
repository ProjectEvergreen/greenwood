import stylesCss from './styles.css?type=css';

document.getElementsByTagName('span')[0].innerHTML = `import from styles.css: ${stylesCss}`;
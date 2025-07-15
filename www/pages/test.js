export default class TestPage extends HTMLElement {
  constructor() {
    super();
    console.log('ENTER TestPage#constructor');
    // this.innerHTML = `
    //   <h1>Hello World from Test Page default export</h1>
    // `
  }

  connectedCallback() {
    this.innerHTML = `
      <h1>Hello World from Test Page default export</h1>
    `
  }
}

// function getBody() {
//   console.log('ENTER TestPage#getLayout')

//   return `<h1>Hello World from Test Page getBody</h1>`
// }


// TODO this causes undefined in the output / is broken
// function getLayout() {
//   console.log('ENTER TestPage#getLayout')
//   return `<h1>Hello World from Test Page getLayout</h1>`
// }

function getFrontmatter() {
  console.log('ENTER TestPage#getFrontmatter')
  return {
    collection: 'navigation',
    order: 7
  }
}

export { getFrontmatter };
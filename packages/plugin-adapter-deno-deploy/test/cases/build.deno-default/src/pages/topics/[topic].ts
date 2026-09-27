export async function getStaticPaths() {
  return [{ params: { topic: "greenwood" } }];
}

export default class TopicPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h1>Static topic</h1>";
  }
}

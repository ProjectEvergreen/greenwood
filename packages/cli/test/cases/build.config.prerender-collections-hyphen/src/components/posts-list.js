import { getContentByCollection } from "@greenwood/cli/src/data/client.js";

export default class MyPostsList extends HTMLElement {
  async connectedCallback() {
    const posts = (await getContentByCollection("my-posts")).sort((a, b) =>
      a.data.order > b.data.order ? 1 : -1,
    );

    this.innerHTML = `
      <ol>
        ${posts
          .map((post) => {
            const { route, label, title } = post;

            return `
              <li><a href="${route}" title="${title}">${label}</a></li>
            `;
          })
          .join("")}
      </ol>
    `;
  }
}

customElements.define("x-my-posts-list", MyPostsList);

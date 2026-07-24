import { getContentByRoute } from "@greenwood/cli/src/data/client.js";

export default class MyBlogRoutes extends HTMLElement {
  async connectedCallback() {
    const pages = (await getContentByRoute("/my-blog")).sort((a, b) =>
      a.data.order > b.data.order ? 1 : -1,
    );

    this.innerHTML = `
      <ul>
        ${pages
          .map((page) => {
            const { route, label, title } = page;

            return `
              <li><a href="${route}" title="${title}">${label}</a></li>
            `;
          })
          .join("")}
      </ul>
    `;
  }
}

customElements.define("x-my-blog-routes", MyBlogRoutes);

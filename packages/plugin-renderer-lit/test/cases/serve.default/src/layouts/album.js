import { LitElement, html } from "lit";

// TODO: constructor props - https://github.com/ProjectEvergreen/greenwood/issues/1248
export default class AlbumPageLayout extends LitElement {
  // TODO: async connectedCallback - https://github.com/lit/lit/issues/2469#issuecomment-1759583861
  connectedCallback() {
    this.albums = [
      {
        id: 1,
        name: "Foo",
      },
      {
        id: 2,
        name: "Bar",
      },
    ];
  }

  render() {
    const { albums } = this;

    return html`
      <body>
        <h1>Album Page</h1>
        <output for="content"></output>
        <ul>
          ${albums.map((album) => {
            const { id, name } = album;

            return html`<li>${id}) ${name}</li>`;
          })}
        </ul>
      </body>
    `;
  }
}

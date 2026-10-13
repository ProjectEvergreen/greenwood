export async function getStaticPaths() {
  const artists = [
    {
      name: "Foo",
    },
    {
      name: "Bar",
    },
    {
      name: "Baz",
    },
  ];

  return artists.map((artist) => {
    return {
      params: {
        name: artist.name.toLowerCase().replace(/ /g, "-"),
        id: artist.id,
      },
    };
  });
}

export default class ArtistDetailsPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <body>
        <h1>Some Artists Page</h1>
      </body>
    `;
  }
}

import fs from "fs/promises";

const customExternalSourcesPlugin = {
  type: "source",
  name: "source-plugin-analogstudios",
  provider: (compilation) => {
    return async function () {
      const artists = JSON.parse(
        await fs.readFile(new URL("./data.json", import.meta.url), "utf-8"),
      );

      return [
        ...artists.map((artist) => {
          const { bio, id, imageUrl, name } = artist;
          const route = `/artists/${name.toLowerCase().replace(/ /g, "-")}/`;

          return {
            title: name,
            body: `
            <p>${bio}</p>
            <img src='${imageUrl}'/>
          `,
            route,
            layout: "artist",
            label: name,
            imageUrl,
            id,
          };
        }),
        {
          title: "Lügner2",
          id: "Lügner2",
          label: "Lügner2",
          route: "/Lügner2/",
          body: `<h1>Lügner2 Page</h1>`,
        },
        {
          title: "First Post",
          id: "first-post",
          label: "First Post",
          route: "/First Post/",
          body: `<h1>First Post Page</h1>`,
        },
        {
          title: "Sitemap",
          body: `
            <ul>
              ${compilation.graph
                .map((page) => {
                  const { label, route } = page;

                  return `<li><a href="${route}">${label}</a></li>`;
                })
                .join("")}
            </ul>
          `,
          route: "/sitemap/",
          label: "Sitemap",
        },
      ];
    };
  },
};

export default {
  activeContent: true,
  plugins: [customExternalSourcesPlugin],
};

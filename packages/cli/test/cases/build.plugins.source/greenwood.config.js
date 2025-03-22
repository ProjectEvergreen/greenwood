import fs from "fs/promises";

const customExternalSourcesPlugin = {
  type: "source",
  name: "source-plugin-analogstudios",
  provider: () => {
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
          // route: "/Lügner2/",
          route: "/L%C3%BCgner2/",
          body: `<h1>Lügner2 Page</h1>`,
        },
        {
          title: "First Post",
          id: "first-post",
          label: "First Post",
          route: "/First%20Post/",
          body: `<h1>First Post Page</h1>`,
        },
      ];
    };
  },
};

export default {
  activeContent: true,
  plugins: [customExternalSourcesPlugin],
};

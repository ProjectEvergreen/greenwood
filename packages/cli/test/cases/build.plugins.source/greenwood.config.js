import fs from 'fs/promises';

const customExternalSourcesPlugin = {
  type: 'source',
  name: 'source-plugin-analogstudios',
  provider: () => {
    return async function () {
      const artists = JSON.parse(await fs.readFile(new URL('./data.json', import.meta.url), 'utf-8'));

      return artists.map((artist) => {
        const { bio, id, imageUrl, name } = artist;
        const route = `/artists/${name.toLowerCase().replace(/ /g, '-')}/`;

        return {
          title: name,
          body: `
            <p>${bio}</p>
            <img src='${imageUrl}'/>
          `,
          route,
          id,
          layout: 'artist',
          label: name,
          data: {
            imageUrl
          }
        };
      });
    };
  }
};

export default {
  plugins: [
    customExternalSourcesPlugin
  ]
};
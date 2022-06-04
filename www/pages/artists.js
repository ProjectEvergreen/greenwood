import fetch from 'node-fetch';

async function getBody() {
  const artists = await fetch('https://www.analogstudios.net/api/artists').then(resp => resp.json());
  const html = artists.map(artist => {
    return `
      <wc-card>
        <h2 slot="title">${artist.name}</h2>
        <img slot="image" src="${artist.imageUrl}" alt="${artist.name}"/>
      </wc-card>
    `;
  }).join('');

  return html;
}

async function getFrontmatter(compilation, route) {
  console.debug({ route });
  return {
    menu: 'navigation',
    index: 7,
    title: route
  };
}

export {
  getFrontmatter,
  getBody
};
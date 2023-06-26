async function getBody() {
  const artists = [{ name: 'Analog', imageUrl: '/assets/analog.png' }];
  const html = artists.map(artist => {
    return `
      <wc-card>
        <h2>${artist.name}</h2>
        <img src="${artist.imageUrl}" alt="${artist.name}"/>
      </wc-card>
    `;
  }).join('');

  return html;
}

export {
  getBody
};
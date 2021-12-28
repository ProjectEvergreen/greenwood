import fetch from 'node-fetch';

async function getTemplate() {
  const artists = await fetch('http://www.analogstudios.net/api/artists').then(resp => resp.json());
  const timestamp = new Date().getTime();
  const artistsListItems = artists
    .filter(artist => artist.isActive === '1')
    .map((artist) => {
      const { id, name, bio, imageUrl } = artist;

      return `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${bio}</td>
          <td><img src="${imageUrl}"/></td>
        </tr>
      `;
    });

  return `
    <html>
      <head>
        <style>
          h1, h6 {
            width: 90%;
            margin: 0 auto;
            text-align: center;
          }
          table {
            width: 80%;
            margin: 20px auto;
            text-align: left;
          }
          img {
            width: 50%;
          }
        </style>
      </head>
      <body>
        <h1>Hello from the server rendered artists page! 👋</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Decription</th>
            <th>Genre</th>
          </tr>
          ${artistsListItems.join('')}
        </table>
        <h6>Fetched at: ${timestamp}</h6>
      </body>
    </html>
  `;
}

async function getContent() {
  return '<h1>Content goes here</h1>';
}

async function getMetadata() {
  return { meta: 'data' };
}

export {
  getTemplate,
  getContent,
  getMetadata
}; 
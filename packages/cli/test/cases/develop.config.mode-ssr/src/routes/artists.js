import fetch from 'node-fetch';

async function getTemplate(compilation, route) {
  return `
    <html>
      <head>
        <meta name="description" content="${compilation.config.title} - ${route} (this was generated server side!!!)">

        <script>
          console.log(${JSON.stringify(compilation.graph.map(page => page.title).join(''))});
        </script>

        <style>
          * {
            color: blue;
          }

          h1 {
            width: 50%;
            margin: 0 auto;
            text-align: center;
            color: red;
          }
        </style>
      </head>
      <body>
        <h1>This heading was rendered server side!</h1>
        <content-outlet></content-outlet>
      </body>
    </html>
  `;
}

async function getBody(compilation) {
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
        <pre>
          ${JSON.stringify(compilation.graph.map(page => page.title).join(''))}
        </pre>
      </body>
    </html>
  `;
}

async function getFrontmatter(compilation, route) {
  return {
    menu: 'navigation',
    index: 7,
    title: `${compilation.config.title} - ${route}`,
    imports: [
      '/components/counter.js'
    ],
    data: {
      author: 'Project Evergreen',
      date: '01-01-2021'
    }
  };
}

export {
  getTemplate,
  getBody,
  getFrontmatter
}; 
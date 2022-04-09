import fetch from 'node-fetch';
import html from './content.html';

async function getTemplate(compilation, route) {
  return `
    <html>
      <head>
        <title>${route}</title>
        <meta name="description" content="${route} (this was generated server side!!!)">

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
        ${html}
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
    <body>
      <h1>Hello from the server rendered artists page! 👋</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Description</th>
          <th>Genre</th>
        </tr>
        ${artistsListItems.join('')}
      </table>
      <h6>Fetched at: ${timestamp}</h6>
      <pre>
        ${JSON.stringify(compilation.graph.map(page => page.title).join(''))}
      </pre>
    </body>
  `;
}

async function getFrontmatter() {
  return {
    menu: 'navigation',
    index: 7,
    data: {
      author: 'Project Evergreen',
      date: '01-01-2021',
      prerender: true
    }
  };
}

export {
  getTemplate,
  getBody,
  getFrontmatter
}; 
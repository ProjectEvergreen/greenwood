import fs from 'fs';
import { html } from 'lit';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import '../components/greeting.js';

async function getTemplate(compilation, route) {
  return html`
    <html>
      <head>
        <meta name="description" content="${route} (this was generated server side!!!)"/>
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

async function getBody() {
  const artists = JSON.parse(await fs.promises.readFile(new URL('../../artists.json', import.meta.url), 'utf-8'));

  return html`
    <h1>Lit SSR response</h1>
    <table>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Description</th>
        <th>Message</th>
        <th>Picture</th>
      </tr>
      ${
        artists.map((artist) => {
          const { id, name, bio, imageUrl } = artist;

          return html`
            <tr>
              <td>${id}</td>
              <td>${name}</td>
              <td>${unsafeHTML(bio)}</td>
              <td>
                <a href="http://www.analogstudios.net/artists/${id}" target="_blank">
                  <simple-greeting .name="${name}"></simple-greeting>
                </a>
              </td>
              <td><img src="${imageUrl}"/></td>
            </tr>
          `;
        })
      }
    </table>
  `;
}

async function getFrontmatter(compilation, route) {
  return {
    menu: 'navigation',
    index: 7,
    title: `My App - ${route}`,
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
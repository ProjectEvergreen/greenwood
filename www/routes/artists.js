// shim import first
import { render } from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';

import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import { html } from 'lit';
import { Readable } from 'stream';

// these must be imported AFTER render-with-global-dom-shim.js
import { helloTemplate } from '../components/hello-template.js';
import '../components/greeting.js';

async function streamToString (stream) {
  const chunks = [];

  for await (let chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks).toString('utf-8');
}

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

  // Lit SSR
  const ssrResultHello = render(helloTemplate());
  const ssrResultHelloData = render(helloTemplate('from the server rendered artists page 👋'));
  const ssrResultLitElement = render(html`<simple-greeting></simple-greeting>`);

  const resultStringHello = await streamToString(Readable.from(ssrResultHello));
  const resultStringHelloData = await streamToString(Readable.from(ssrResultHelloData));
  const resultStringLitElement = await streamToString(Readable.from(ssrResultLitElement));

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
        <div style="display:none">${resultStringHello}</div>
        
        <h1>${resultStringHelloData}</h1>
        <h1>${resultStringLitElement}</h1>
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
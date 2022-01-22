import fetch from 'node-fetch';
import { html } from 'lit';
import '../components/greeting.js';

export async function getBody() {
  const artists = await fetch('http://www.analogstudios.net/api/artists').then(resp => resp.json());

  return html`
    <h1>Lit SSR response!!!</h1>
    <table>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Decription</th>
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
              <td>${bio}</td>
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

export async function getFrontmatter(compilation, route) {
  return {
    template: 'blog',
    menu: 'navigation',
    index: 7,
    title: `${compilation.config.title} - ${route}`,
    data: {
      prerender: true
    }
  };
}
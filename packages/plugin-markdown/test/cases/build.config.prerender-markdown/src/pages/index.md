---
imports:
  - /components/x-ctc.js
---

## Server Rendering

You will need to use version <= 20.6.0.

<x-ctc>

  ```js
  import "../components/card/card.js"; // <x-card></x-card>

  export default class UsersPage extends HTMLElement {
    async connectedCallback() {
      const users = await fetch("https://www.example.com/api/users").then((resp) => resp.json());
      const html = users
        .map((user) => {
          const { name, imageUrl } = user;
          return `
            <x-card>
              <h2 slot="title">${name}</h2>
              <img slot="image" src="${imageUrl}" alt="${name}"/>
            </x-card>
          `;
        })
        .join("");

      this.innerHTML = html;
    }
  }
  ```

</x-ctc>
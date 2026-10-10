import "../components/greeting.jsx";

export default class WelcomePage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <head>
        <script type="module" src="../components/greeting.jsx"></script>
      </head>
      <body>
        <wcc-greeting></wcc-greeting>
      </body>
    `;
  }
}

export const staticExport = true;

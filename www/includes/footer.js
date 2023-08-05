import fs from 'fs/promises';

const getTemplate = async (data) => {
  return `
    <app-footer>
      <style>
        footer {
          grid-area: footer;
        }

        footer {
          background-color: #192a27;
          min-height: 30px;
          padding-top: 10px;
        }
        
        footer h4 {
          width: 90%;
          margin: 0 auto!important;
          padding: 0;
          text-align: center;
        }
        
        footer a {
          color: white;
          text-decoration: none;
        }
        
        footer span.separator {
          color: white;
        }
      </style>
      <footer class="footer">
        <h4>
          <a href="/my-subpath/">Greenwood v${data.version}</a> <span class="separator">&#9672</span> <a href="https://www.netlify.com/">This site is powered by Netlify</a>
        </h4>
      </footer>
    </app-footer>`;
};

const getData = async () => {
  const version = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')).version;

  return { version };
};

export {
  getTemplate,
  getData
};
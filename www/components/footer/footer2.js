const getTemplate = async (data) => {
  return `
    <app-footer2>
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
          <a href="/">Greenwood v${data.version}</a> <span class="separator">&#9672</span> <a href="https://www.netlify.com/">This site is powered by Netlify</a>
        </h4>
      </footer>
    </app-footer2>`;
};

const getData = async () => {
  const version = require('../../package.json').version;

  return { version };
};

module.exports = {
  getTemplate,
  getData
};
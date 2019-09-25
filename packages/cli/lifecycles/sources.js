const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

let optionsList = {
  method: 'GET',
  json: true
};

// Wordpress API Reference
// https://developer.wordpress.org/rest-api/reference/

const fetchWPPosts = async (compilation) => {

  optionsList.uri = compilation.config.wpSource + '/wp-json/wp/v2/posts';
  optionsList.body = { page: 1 }; // TODO: this is just for development/testing

  return await rp.get(optionsList);
};

// Future amendments for more of wordpress API
// const fetchWPPages = async (compilation) => {

//   optionsList.uri = compilation.config.wpSource + '/wp-json/wp/v2/pages';

//   return await rp.get(optionsList);
// };

// const fetchWPCategories = async (compilation) => {

//   optionsList.uri = compilation.config.wpSource + '/wp-json/wp/v2/categories';

//   return await rp.get(optionsList);
// };

// Generate a random hash based on slug
const generateLabel = (slug) => {
  const labelHash = {
    algo: 'sha256',
    trim: 15
  };
  let elementLabel = '';
  const hash = crypto.createHash(labelHash.algo);

  hash.update(slug || '');
  elementLabel = hash.digest('hex');
  const labelLength = elementLabel.length;

  return elementLabel.substring(labelLength - labelHash.trim, labelLength);
};

const generateWPGraph = async(wpJSON, config) => {

  return Promise.all(wpJSON.map(async (post) => {
    return new Promise((resolve, reject) => {
      try {
        let { title, content, slug } = post;
        let fileName = slug.substring(0, 100); // needs to be trimmed better this is hacky
        let graphPost = {
          type: 'wp',
          meta: config.meta,
          template: 'page',
          title: title.rendered,
          content: content.rendered,
          route: `/${slug}/`,
          relativeExpectedPath: `'../${fileName}/${fileName}.js'`,
          label: generateLabel(slug),
          fileName
        };

        resolve(graphPost);
      } catch (err) {
        reject();
      }
    });
  }));
};

/*
* Note: This is the same function from our scaffold.js, with small modifications
*/
const writePageComponentsFromTemplate = async (compilation) => {
  const createPageComponent = async (file, context) => {
    return new Promise(async (resolve, reject) => {
      try {
        const pageTemplatePath = file.template === 'page'
          ? context.pageTemplatePath
          : path.join(context.templatesDir, `${file.template}-template.js`);

        const templateData = await fs.readFileSync(pageTemplatePath);

        let result = templateData.toString().replace(/<entry><\/entry>/g, file.content); // modified from scaffold.js

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT;/, '');

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  const loadPageMeta = async (file, result, { metaComponent }) => {

    return new Promise((resolve, reject) => {
      try {
        const { title, meta, route } = file;
        const metadata = {
          title,
          meta,
          route
        };

        result = result.replace(/METAIMPORT/, `import '${metaComponent}'`);
        result = result.replace(/METADATA/, `const metadata = ${JSON.stringify(metadata)}`);
        result = result.replace(/METAELEMENT/, '<eve-meta .attributes=\${metadata}></eve-meta>');

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  return Promise.all(compilation.graph.map(file => {
    const context = compilation.context;

    return new Promise(async(resolve, reject) => {
      try {
        // modified from scaffold.js
        if (file.type === 'wp') {
          let result = await createPageComponent(file, context);

          result = await loadPageMeta(file, result, context);

          target = path.join(context.scratchDir, file.fileName); // modified from scaffold.js

          if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
          }
          await fs.writeFileSync(path.join(target, `${file.fileName}.js`), result);
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }));

};

module.exports = generateFromSources = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Fetch Wordpress Sources...');
      const wpJSON = await fetchWPPosts(compilation);

      console.log('Generating graph from sources...');
      compilation.graph.push(...await generateWPGraph(wpJSON, compilation.config));

      console.log('Generate pages from templates...');
      await writePageComponentsFromTemplate(compilation);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }

  });
};
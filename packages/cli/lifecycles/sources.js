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
  optionsList.body = { page: 1 };  /// pagination

  return await rp.get(optionsList);
};

// const fetchWPPages = async (compilation) => {

//   optionsList.uri = compilation.config.wpSource + '/wp-json/wp/v2/pages';

//   return await rp.get(optionsList);
// };

// const fetchWPCategories = async (compilation) => {

//   optionsList.uri = compilation.config.wpSource + '/wp-json/wp/v2/categories';

//   return await rp.get(optionsList);
// };
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
        let fileName = slug.substring(0, 100);
        let graphPost = {
          meta: config.meta,
          template: 'page',
          title: title.rendered,
          content: content.rendered,
          route: `/${slug}/`,
          relativeExpectedPath: `../${fileName}/${fileName}.js`,
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

const writePageComponentsFromTemplate = async (compilation) => {
  const createPageComponent = async (file, context) => {
    return new Promise(async (resolve, reject) => {
      try {
        const pageTemplatePath = file.template === 'page'
          ? context.pageTemplatePath
          : path.join(context.templatesDir, `${file.template}-template.js`);

        const templateData = await fs.readFileSync(pageTemplatePath);

        let result = templateData.toString().replace(/entry/g, file.content);

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

  // insert home page
  const fileName = 'index';

  compilation.graph.unshift({
    meta: compilation.config.meta,
    template: 'page',
    title: 'Home Page',
    content: 'Home page',
    route: '/',
    relativeExpectedPath: `../${fileName}/${fileName}.js`,
    label: generateLabel(fileName),
    fileName
  });

  return Promise.all(compilation.graph.map(file => {
    const context = compilation.context;

    return new Promise(async(resolve, reject) => {
      try {
        let result = await createPageComponent(file, context);

        result = await loadPageMeta(file, result, context);

        target = path.join(context.scratchDir, file.fileName);

        if (!fs.existsSync(target)) {
          fs.mkdirSync(target, { recursive: true });
        }
        await fs.writeFileSync(path.join(target, `${file.fileName}.js`), result);

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }));

};

const writeListImportFile = async (compilation) => {
  const importList = compilation.graph.map(file => {
    return `import \'${file.relativeExpectedPath}\';\n`;
  });

  // Create app directory so that app-template relative imports are correct
  const appDir = path.join(compilation.context.scratchDir, 'app');

  if (!fs.existsSync(appDir)) {
    await fs.mkdirSync(appDir);
  }

  return await fs.writeFileSync(path.join(appDir, './list.js'), importList.join(''));
};

const writeRoutes = async(compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await fs.readFileSync(compilation.context.appTemplatePath);

      const routes = compilation.graph.map(file => {
        return `<lit-route path="${file.route}" component="eve-${file.label}"></lit-route>\n\t\t\t\t`;
      });

      const result = data.toString().replace(/MYROUTES/g, routes.join(''));

      await fs.writeFileSync(path.join(compilation.context.scratchDir, 'app', './app.js'), result);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

// eslint-disable-next-line no-unused-vars
const setupIndex = async({ context }) => {
  return new Promise(async (resolve, reject) => {
    try {
      fs.copyFileSync(
        context.indexPageTemplatePath,
        path.join(context.scratchDir, context.indexPageTemplate)
      );
      fs.copyFileSync(
        context.notFoundPageTemplatePath,
        path.join(context.scratchDir, context.notFoundPageTemplate)
      );
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

// const generateHomePage = async(compilation) => {
//   return new Promise(async(resolve, reject) => {
//     try {

//       const createHomePage = (compilation) => {
//         `
//         import { html, LitElement } from 'lit-element';

//         class PageTemplate extends LitElement {

//         `;
//       };

//       homePage = createHomePage(compilation);
//       target = path.join(context.scratchDir, 'index');

//       if (!fs.existsSync(target)) {
//         fs.mkdirSync(target, { recursive: true });
//       }
//       await fs.writeFileSync(path.join(target, 'index.js'), homePage);
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

const scaffoldFromWPGraph = async(compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Generate pages from templates...');
      await writePageComponentsFromTemplate(compilation);

      console.log('Writing imports for md...');
      await writeListImportFile(compilation);

      console.log('Writing Lit routes...');
      await writeRoutes(compilation);

      console.log('setup index page and html');
      await setupIndex(compilation);

      // console.log('generate home page');
      // await generateHomePage(compilation);

      console.log('Scaffolding complete.');
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};

module.exports = generateFromSources = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Fetch Wordpress Sources...');
      const wpJSON = await fetchWPPosts(compilation);

      // console.log(wpJSON);

      console.log('Generating graph from sources...');
      const wpGraph = await generateWPGraph(wpJSON, compilation.config);

      // console.log(wpGraph);
      compilation.graph = wpGraph;

      console.log('Scaffolding from WP Graph...');
      await scaffoldFromWPGraph(compilation);

      resolve();
    } catch (err) {
      reject(err);
    }

  });
};
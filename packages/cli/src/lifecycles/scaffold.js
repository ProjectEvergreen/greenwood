const fs = require('fs-extra');
const path = require('path');

const writePageComponentsFromTemplate = async (compilation) => {
  const createPageComponent = async (file, context) => {
    return new Promise(async (resolve, reject) => {
      try {
        const pageTemplatePath = file.template === 'page'
          ? context.pageTemplatePath
          : path.join(context.templatesDir, `${file.template}-template.js`);

        const templateData = await fs.readFile(pageTemplatePath, 'utf8');

        let result = templateData.toString().replace(/entry/g, `wc-md-${file.label}`);

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT;/, `import '${file.mdFile}';`);

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  const writePageComponentToFile = async (target, filename, result) => {
    return new Promise(async(resolve, reject) => {
      try {
        await fs.ensureDir(target, { recursive: true });
        await fs.writeFile(path.join(target, `${filename}.js`), result);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  const getPageComponentPath = (file, context) => {
    let relPageDir = file.filePath.substring(context.pagesDir.length, file.filePath.length);
    let pagePath = '';
    const pathLastBackslash = relPageDir.lastIndexOf('/');

    pagePath = path.join(context.scratchDir, file.fileName); // non-nested default

    if (pathLastBackslash !== 0) {
      pagePath = path.join(context.scratchDir, relPageDir.substring(0, pathLastBackslash), file.fileName); // nested path
    }

    return pagePath;
  };

  return Promise.all(compilation.graph.map(file => {
    const context = compilation.context;

    return new Promise(async(resolve, reject) => {
      try {
        // Create Standard Page Component from Markdown File
        const result = await createPageComponent(file, context);

        // Determine path to newly scaffolded component
        const filePath = getPageComponentPath(file, context);

        // Write finished component
        await writePageComponentToFile(filePath, file.fileName, result);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }));

};

const writeRoutes = async(compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await fs.readFile(compilation.context.appTemplatePath, 'utf8');

      const routes = compilation.graph.map(file => {
        return `<lit-route
          path="${file.route}"
          component="eve-${file.label}"
          .resolve="\${() => import(/* webpackChunkName: "${file.chunkName}" */ ${file.relativeExpectedPath})}"
          ></lit-route>`;
      });

      const result = data.toString().replace(/MYROUTES/g, routes.join(''));
      // Create app directory so that app-template relative imports are correct
      const appDir = path.join(compilation.context.scratchDir, 'app');

      await fs.ensureDir(appDir);
      await fs.writeFile(path.join(appDir, './app-template.js'), result);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const writeBaseAppTemplate = async({ context }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await fs.readFile(path.join(__dirname, '../templates/', 'base-template.js'), 'utf8');
      const appDir = path.join(context.scratchDir, 'app');

      await fs.ensureDir(appDir);
      await fs.writeFile(path.join(appDir, './app.js'), data);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const setupIndex = async({ context }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.copy(
        context.indexPageTemplatePath,
        path.join(context.scratchDir, context.indexPageTemplate)
      );
      await fs.copy(
        context.notFoundPageTemplatePath,
        path.join(context.scratchDir, context.notFoundPageTemplate)
      );
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateScaffolding = async (compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Generate pages from templates...');
      await writePageComponentsFromTemplate(compilation);

      console.log('Writing Lit routes...');
      await writeRoutes(compilation);

      console.log('Write Base App Template...');
      await writeBaseAppTemplate(compilation);

      console.log('setup index page and html');
      await setupIndex(compilation);

      console.log('Scaffolding complete.');
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};
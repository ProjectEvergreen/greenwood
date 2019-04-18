const fs = require('fs');
const path = require('path');

const writePageComponentsFromTemplate = async (compilation) => {
  const createPageComponent = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await fs.readFileSync(path.join(compilation.context.templatesDir, `${file.template}-template.js`));
        let result = data.toString().replace(/entry/g, `wc-md-${file.label}`);

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT;/, `import '${file.mdFile}';`);

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
        let result = await createPageComponent(file);

        let relPageDir = file.filePath.substring(context.pagesDir.length, file.filePath.length);
        const pathLastBackslash = relPageDir.lastIndexOf('/');

        target = path.join(context.scratchDir, file.fileName); // non-nested default

        if (pathLastBackslash !== 0) {
          target = path.join(context.scratchDir, relPageDir.substring(0, pathLastBackslash), file.fileName); // nested path
        }

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
    return `import ${file.relativeExpectedPath};\n`;
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
      let data = await fs.readFileSync(path.join(compilation.context.templatesDir, `${compilation.context.appTemplate}`));

      const routes = compilation.graph.map(file => {
        if (file.route !== '/') {
          return `<lit-route path="${file.route}" component="eve-${file.label}"></lit-route>\n\t\t\t\t`;
        }
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
const setupIndex = async(compilation) => {
  return new Promise(async (resolve, reject) => {
    const context = compilation.context;
    let indexHtml = 'index.html';
    let notFoundHtml = '404.html';
    let devIndexHtml = 'index.dev.html';
    let devNotFoundHtml = '404.dev.html';

    try {

      // create redirect 404 pages for lit-redux-router + SPA fallback for development
      if (process.env.NODE_ENV === 'development') {
        fs.copyFileSync(path.resolve(context.templatesDir, devNotFoundHtml), path.join(context.scratchDir, devNotFoundHtml));
        fs.copyFileSync(path.resolve(context.templatesDir, devIndexHtml), path.join(context.scratchDir, devIndexHtml));
      }

      fs.copyFileSync(path.resolve(context.templatesDir, notFoundHtml), path.join(context.scratchDir, notFoundHtml));
      fs.copyFileSync(path.resolve(context.templatesDir, indexHtml), path.join(context.scratchDir, indexHtml));
   
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

      console.log('Writing imports for md...');
      await writeListImportFile(compilation);

      console.log('Writing Lit routes...');
      await writeRoutes(compilation);

      console.log('setup index page and html');
      await setupIndex(compilation);
      
      console.log('Scaffolding complete.');
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};
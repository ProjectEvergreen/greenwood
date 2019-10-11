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

  const loadPageMeta = (file, result, { metaComponent }) => {
    const { title, meta, route } = file;
    const metadata = {
      title,
      meta,
      route
    };

    result = result.replace(/METAIMPORT/, `import '${metaComponent}'`);
    result = result.replace(/METADATA/, `const metadata = ${JSON.stringify(metadata)}`);
    result = result.replace(/METAELEMENT/, '<eve-meta .attributes=\${metadata}></eve-meta>');

    return result;
  };

  const writeComponentToFile = async (target, filename, result) => {
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

  const setCachedComponentPath = (file, context) => {
    let relPageDir = file.filePath.substring(context.pagesDir.length, file.filePath.length);
    const pathLastBackslash = relPageDir.lastIndexOf('/');

    target = path.join(context.scratchDir, file.fileName); // non-nested default

    if (pathLastBackslash !== 0) {
      target = path.join(context.scratchDir, relPageDir.substring(0, pathLastBackslash), file.fileName); // nested path
    }
    return target;
  };

  return Promise.all(compilation.graph.map(file => {
    const context = compilation.context;

    return new Promise(async(resolve, reject) => {
      try {
        // Create Standard Component from Markdown File
        let result = await createPageComponent(file, context);

        // Add Meta Data based on config
        result = loadPageMeta(file, result, context);

        // Determine target path for newly scaffolded component
        target = setCachedComponentPath(file, context);

        // Write finished component
        await writeComponentToFile(target, file.fileName, result);
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
  
  await fs.ensureDir(appDir);
  return await fs.writeFile(path.join(appDir, './list.js'), importList.join(''));
};

const writeRoutes = async(compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await fs.readFile(compilation.context.appTemplatePath, 'utf8');

      const routes = compilation.graph.map(file => {
        return `<lit-route path="${file.route}" component="eve-${file.label}"></lit-route>\n\t\t\t\t`;
      });

      const result = data.toString().replace(/MYROUTES/g, routes.join(''));

      await fs.writeFile(path.join(compilation.context.scratchDir, 'app', './app.js'), result);

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
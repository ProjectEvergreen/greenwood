const fs = require('fs');
const path = require('path');

const writePageComponentsFromTemplate = async (compilation) => {
  const createPageComponent = async (file, context) => {
    return new Promise(async (resolve, reject) => {
      try {
        const pageTemplatePath = file.template === 'page' 
          ? context.pageTemplatePath 
          : path.join(context.templatesDir, `${file.template}-template.js`);
        
        const templateData = await fs.readFileSync(pageTemplatePath);

        let result = templateData.toString().replace(/entry/g, `wc-md-${file.label}`);

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT;/, `import '${file.mdFile}';`);

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };
  const loadPageMeta = async (file, result, { context, config }) => {
    return new Promise((resolve, reject) => {
      try {
        const metadata = {
          title: '',
          meta: []
        };
        let title = '', metaComponent = '';

        if (config.meta && config.meta.length > 0) {
          metadata.meta = config.meta;
        }

        if (config.title) {
          title = config.title;
        }
        
        // override title with dynamic title per page if available
        if (file.title) {
          title = file.title;
        }
        metadata.title = title;
        metadata.meta['og:title'] = title;
    
        // Temporary workaround to webpack config's import path adjustment issue 
        // when using importing default template components ./ vs ../ for userWorkspace

        // if we're using default page template
        const isDefaultTemplate = context.userWorkspace === path.join(context.defaultTemplatesDir);

        metaComponent = isDefaultTemplate 
          ? './components/meta.js'
          : '../components/meta.js';

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
        let result = await createPageComponent(file, context);

        result = await loadPageMeta(file, result, compilation);
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
        path.join(context.templatesDir, context.indexPageTemplate), 
        path.join(context.scratchDir, context.indexPageTemplate)
      );
      fs.copyFileSync(
        path.join(context.templatesDir, context.notFoundPageTemplate), 
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
const fs = require('fs');
const path = require('path');

const writePageComponentsFromTemplate = async (config, compilation) => {
  const createPageComponent = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await fs.readFileSync(path.join(config.templatesDir, `${file.template}-template.js`));
        let result = data.toString().replace(/entry/g, `wc-md-${file.label}`);

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT/, `import '${file.import}';`);

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  return Promise.all(compilation.graph.map(file => {
    if (file.label !== 'index') {
      return new Promise(async(resolve, reject) => {
        try {
          let result = await createPageComponent(file);

          // create page directory
          await fs.mkdirSync(path.join(config.scratchDir, file.label))

          // create page in page directory
          await fs.writeFileSync(path.join(config.scratchDir, `${file.label}/${file.label}.js`), result);
          
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }
  }));

};

const writeListImportFile = async (config, compilation) => {
  let arr = compilation.graph.map(file => {
    if (file.label !== 'index') {
      return `import '../${file.label}/${file.label}.js';\n`;
    }
  });

  /// Create app directory so that app-template relative imports are correct
  const appDir = path.join(config.scratchDir, 'app');
  await fs.mkdirSync(appDir);
  
  return await fs.writeFileSync(path.join(appDir, './list.js'), arr.join(''));
};

const writeRoutes = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await fs.readFileSync(path.join(config.templatesDir, './app-template.js'));

      const routes = compilation.graph.map(file => {
        if (file.label !== 'index') {
          return `<lit-route path="${file.path}" component="eve-${file.label}"></lit-route>\n\t\t\t\t`;
        }
      });

      const result = data.toString().replace(/MYROUTES/g, routes.join(''));

      await fs.writeFileSync(path.join(config.scratchDir, 'app', './app.js'), result);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const setupIndex = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const componentDir = !config.default ? 'components' : '' ;
      const homeCompPath = path.join(config.scratchDir, componentDir)
      
      if(!config.default) {
        fs.mkdirSync(homeCompPath);
      }
      fs.copyFileSync(config.homeComponent, path.join(homeCompPath, 'index.js'));
      fs.copyFileSync(config.rootIndex, path.join(config.scratchDir, 'index.html'));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const copyMarkdownForPages = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      compilation.graph.map((file) => {
        if(file.label !== 'index') {
          fs.copyFileSync(
            path.join(config.pagesDir, `${file.label}.md`), 
            path.join(config.scratchDir, `${file.label}/${file.label}.md`)
          );
        }
      })
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};


module.exports = generateScaffolding = async (config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {      
      console.log('Generate pages from templates...');
      await writePageComponentsFromTemplate(config, compilation);

      console.log('Writing imports for md...');
      await writeListImportFile(config, compilation);

      console.log('Copying mardkown for pages');
      await copyMarkdownForPages(config, compilation);

      console.log('Writing Lit routes...');
      await writeRoutes(config, compilation);

      console.log('setup index page and html');
      await setupIndex(config, compilation);
      
      console.log('Scaffolding complete.');
      resolve();
    } catch (err) {
      reject(err);
    }

  });
};
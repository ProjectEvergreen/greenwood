const fs = require('fs');
const path = require('path');

const writePageComponentsFromTemplate = async (config, compilation) => {
  const createPageComponent = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await fs.readFileSync(path.join(config.templatesDir, `${file.template}-template.js`));
        let result = data.toString().replace(/entry/g, `wc-md-${file.label}`);

        result = result.replace(/page-template/g, `eve-${file.label}`);
        result = result.replace(/MDIMPORT;/, `import '${file.import}';`);

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };

  return Promise.all(compilation.graph.map(file => {
    return new Promise(async(resolve, reject) => {
      try {
        let result = await createPageComponent(file);

        let relPageDir = file.filePath.substring(config.pagesDir.length, file.filePath.length);
        
        // console.log(relPageDir);

        if (relPageDir.lastIndexOf('/') !== 0) {
          let subDir = relPageDir.substring(1, relPageDir.length).split('/');
          let nestedPath = '';

          await Promise.all(subDir.map(async (dir, it) => {
            if (it !== subDir.length - 1) {
              nestedPath = path.join(nestedPath, dir);

              if (!fs.existsSync(path.join(config.scratchDir, nestedPath))) {
                return await fs.mkdirSync(path.join(config.scratchDir, nestedPath));
              }
            }
          }));
          // fs.mkdirSync(target, { recursive: true }); possible refactor
          // create page directory
          await fs.mkdirSync(path.join(config.scratchDir, nestedPath, file.label));
          // create page in page directory
          await fs.writeFileSync(path.join(config.scratchDir, nestedPath, `${file.label}/${file.label}.js`), result);
        } else {
          // create page directory
          await fs.mkdirSync(path.join(config.scratchDir, file.label));
          // create page in page directory
          await fs.writeFileSync(path.join(config.scratchDir, `${file.label}/${file.label}.js`), result);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }));

};

const writeListImportFile = async (config, compilation) => {
  let arr = compilation.graph.map(file => {
    return `import ${file.relativeExpectedPath};\n`;
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

// eslint-disable-next-line no-unused-vars
const setupIndex = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      fs.copyFileSync(config.rootIndex, path.join(config.scratchDir, 'index.html'));
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
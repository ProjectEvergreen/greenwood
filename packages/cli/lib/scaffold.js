const fs = require('fs');
const path = require('path');

const writePageComponentsFromTemplate = async (config, compilation) => {
  const createPageComponent = async (file) => {
    console.log('file', file);
    return new Promise(async (resolve, reject) => {
      try {
        let data = await fs.readFileSync(path.join(config.templatesDir, `${file.template}-template.js`));
        let result = data.toString().replace(/entry/g, 'wc-md-' + file.label);

        result = result.replace(/page-template/g, 'eve-' + file.label);
        result = result.replace(/MDIMPORT/, 'import \'' + file.import + '\';');

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
          await fs.mkdirSync(path.join(config.scratchDir, file.label))

          await fs.writeFileSync(path.join(config.scratchDir, `${file.label}/${file.label}.js`), result);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }
  }));

};

const writeImportFile = async (config, compilation) => {
  let arr = compilation.graph.map(file => {
    if (file.label !== 'index') {
      return `import './${file.label}/${file.label}.js';\n`;
    }
  });

  return await fs.writeFileSync(path.join(config.scratchDir, './list.js'), arr.join(''));
};

const writeRoutes = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data;

      if (fs.existsSync(config.templatesDir)) {
        data = await fs.readFileSync(path.join(config.templatesDir, './app-template.js'));
      } else {
        data = await fs.readFileSync(path.join(__dirname, '..', './templates', './app-template.js'));
      }

      const routes = compilation.graph.map(file => {
        if (file.label !== 'index') {
          return '<lit-route ' + 'path=\"' + file.path + '\" component=\"eve-' + file.label + '\"></lit-route>\n\t\t\t\t';
        }
      });

      const result = data.toString().replace(/MYROUTES/g, routes.join(''));

      await fs.writeFileSync(path.join(config.scratchDir, './app.js'), result);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const setupIndex = async(config, compilation) => {
  return new Promise(async (resolve, reject) => {
    try {
      fs.copyFileSync(path.join(config.pagesDir, './index.js'), path.join(config.scratchDir, 'index.js'));
      fs.copyFileSync(path.join(config.templatesDir, './index.html'), path.join(config.scratchDir, 'index.html'));
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
      await writeImportFile(config, compilation);

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
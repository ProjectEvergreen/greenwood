const BrowserRunner = require('../lib/browser');
const fs = require('fs');
const { promises: fsp } = require('fs');
const path = require('path');
const generateCompilation = require('../lifecycles/compile');
const { server } = require('../lifecycles/serve');

module.exports = runProductionBuild = async () => {

  return new Promise(async (resolve, reject) => {

    try {
      const compilation = await generateCompilation();
      const browserRunner = new BrowserRunner();
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.outputDir;

      await browserRunner.init();
      
      // TODO make server a promise
      server.listen(port, async () => {
        console.info(`Started server for production serializartion at localhost:${port}`);
        // TODO move to serialize lifecycle when implementing full graph

        // TODO pull from graph.json
        const pages = ['index.html'];

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        await browserRunner.init();
      
        await Promise.all(pages.map(async(page) => {
          console.info('serializing page...', page);
              
          return await browserRunner
            .serialize(`http://127.0.0.1:${port}/${page}`)
            .then(async (html) => {
              console.info(`content arrived for page => ${page}!!!`);
              let outputPath = page;

              // TODO seems a little hacky, needs to keep lockstepping with rollup?
              if (page.indexOf('/') > 0 && page.indexOf('index.html') < 0) {
                // console.log('non root nested page found!!!!');
                let pieces = page.split('/');
    
                pieces[pieces.length - 1] = pieces[pieces.length - 1].replace('.html', '/');

                outputPath = `${pieces.join('/')}index.html`;
              }
              
              // TODO allow setup / teardown (e.g. module shims, then remove module-shims)
              let htmlModified = html;

              // TODO should really be happening via plugins or other standardize setup / teardown mechanism
              htmlModified = htmlModified.replace(/<script src="\/node_modules\/@webcomponents\/webcomponentsjs\/webcomponents-bundle.js"><\/script>/, '');
              htmlModified = htmlModified.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
              htmlModified = htmlModified.replace(/<script defer="" src="\/node_modules\/es-module-shims\/dist\/es-module-shims.js"><\/script>/, '');
              htmlModified = htmlModified.replace(/<script type="module-shim"/g, '<script type="module"');

              // console.debug('final HTML', htmlModified);
              await fsp.writeFile(path.join(outputDir, outputPath), htmlModified);
            });
        }))

        console.info('done serializing?');
        browserRunner.close();

        //   // TODO rollup only understands ESM in Node :/
        //   // rollup.write(rollupConfig);

        //   // 5) run rollup on .greenwood and put into public/
        //   // TODO this is a hack just for the sake of the POC, will do for real :)
        //   execSync('rollup -c ./rollup.config.js');

        // process.exit(0); // eslint-disable-line no-process-exit
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return false;
    }
  });
};
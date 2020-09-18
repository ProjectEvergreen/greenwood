const BrowserRunner = require('../lib/browser');
const { promises: fsp } = require('fs');
const path = require('path');

module.exports = serializeBuild = async (compilation) => {
  const browserRunner = new BrowserRunner();
  await browserRunner.init();

  const runBrowser = async (serverUrl, pages, outputDir) => {

    try {
      return Promise.all(pages.map(async(page) => {
        console.info('serializing page...', page);
            
        return await browserRunner
          .serialize(`${serverUrl}/${page}`)
          .then(async (html) => {
            console.info(`content arrived for page => ${page}!!!`);
            let outputPath = page;
  
            // TODO seems a little hacky, needs to keep lockstepping with rollup?
            // if (page.indexOf('/') > 0 && page.indexOf('index.html') < 0) {
            //   // console.log('non root nested page found!!!!');
            //   let pieces = page.split('/');
  
            //   pieces[pieces.length - 1] = pieces[pieces.length - 1].replace('.html', '/');
  
            //   outputPath = `${pieces.join('/')}index.html`;
            // }
            
            // TODO allow setup / teardown (e.g. module shims, then remove module-shims)
            let htmlModified = html;
  
            // TODO should really be happening via plugins or other standardize setup / teardown mechanism
            htmlModified = htmlModified.replace(/<script src="\/node_modules\/@webcomponents\/webcomponentsjs\/webcomponents-bundle.js"><\/script>/, '');
            htmlModified = htmlModified.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
            htmlModified = htmlModified.replace(/<script defer="" src="\/node_modules\/es-module-shims\/dist\/es-module-shims.js"><\/script>/, '');
            htmlModified = htmlModified.replace(/<script type="module-shim"/g, '<script type="module"');
  
            // console.debug('final HTML', htmlModified);
            console.info(`Serializing complete for page ${page} \n outputting... ${outputDir.replace(process.cwd(), '.')}${outputPath}`);
            await fsp.writeFile(path.join(outputDir, outputPath), htmlModified);
        });
      }))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(err);
      return false;
    }
  };

  return new Promise(async (resolve, reject) => {
    try {
      const pages = ['index.html']; // TODO all pages from ompilation.graph;
      const port = compilation.config.devServer.port;
      const outputDir = compilation.context.scratchDir;
      const serverAddress = `http://127.0.0.1:${port}`;

      console.debug(`Serializing pages at ${serverAddress}`);
      console.debug('pages to generate', `\n ${pages.join('\n  ')}`);
  
      await runBrowser(serverAddress, pages, outputDir);
      
      console.info('done serializing all pages');
      browserRunner.close();

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
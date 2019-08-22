const path = require('path');
const GreenwoodPlugin = require('../../packages/plugin');
const metaComponent = path.join(__dirname, 'metacomponent');

/* Plugin could be packaged as @greenwood/meta-plugin */

class MetaPlugin extends GreenwoodPlugin {
  constructor() {
    super();
  }

  scaffold(file, result, compilation) {
    return new Promise((resolve, reject) => {

      try {

        const { title, meta, route } = file;
        const metadata = {
          title,
          meta,
          route
        };

        const regexArr = [
          {
            regex: /METAIMPORT/,
            replace: `import '${metaComponent}'`
          },
          {
            regex: /METADATA/,
            replace: `const metadata = ${JSON.stringify(metadata)}`
          },
          {
            regex: /METAELEMENT/,
            replace: '<eve-meta .attributes=\${metadata}></eve-meta>'
          }
        ];

        result = this.scaffoldMultiHook(result, regexArr);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = MetaPlugin;
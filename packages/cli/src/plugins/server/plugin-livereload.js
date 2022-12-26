import fs from 'fs';
import livereload from 'livereload';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { ServerInterface } from '../../lib/server-interface.js';

class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    const { userWorkspace } = this.compilation.context;
    const standardPluginsDirectoryPath = new URL('../resource/', import.meta.url);
    const standardPluginsNames = fs.readdirSync(standardPluginsDirectoryPath)
      .filter(filename => filename.indexOf('plugin-standard') === 0);
    const standardPluginsExtensions = (await Promise.all(standardPluginsNames.map(async (filename) => {
      const pluginImport = await import(new URL(`./${filename}`, standardPluginsDirectoryPath));
      const plugin = pluginImport[Object.keys(pluginImport)[0]];
      
      return plugin;
    })))
      .filter(plugin => plugin.type === 'resource')
      .map((plugin) => plugin.provider(this.compilation).extensions.flat())
      .flat();
    const customPluginsExtensions = this.compilation.config.plugins
      .filter((plugin) => plugin.type === 'resource')
      .map((plugin) => {
        return plugin.provider(this.compilation).extensions.flat();
      }).flat();

    // filter out wildcards or otherwise undesired values and remove any . since livereload likes them that way
    const allExtensions = [
      ...standardPluginsExtensions,
      ...customPluginsExtensions,
      ...this.compilation.config.devServer.extensions
    ]
      .filter((ext) => ext !== '*' || ext !== '')
      .map((ext) => ext.replace('.', ''));

    const liveReloadServer = livereload.createServer({
      exts: allExtensions.filter((ext, idx) => idx === allExtensions.indexOf(ext)),
      applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
    });

    liveReloadServer.watch(userWorkspace.pathname, () => {
      console.info(`Now watching directory "${userWorkspace}" for changes.`);
      return Promise.resolve(true);
    });
  }
}

class LiveReloadResource extends ResourceInterface {
  
  async shouldIntercept(url, request, response) {
    const contentType = response.headers.get('content-type');

    return contentType.indexOf('text/html') >= 0 && process.env.__GWD_COMMAND__ === 'develop'; // eslint-disable-line no-underscore-dangle
  }

  async intercept(url, request, response) {
    let body = await response.text();
    
    body = body.replace('</head>', `
        <script src="http://localhost:35729/livereload.js?snipver=1"></script>
      </head>
    `);

    // TODO avoid having to rebuild response each time?
    return new Response(body, {
      headers: response.headers
    });
  }
}

const greenwoodPluginLivereload = [{
  type: 'server',
  name: 'plugin-live-reload:server',
  provider: (compilation) => new LiveReloadServer(compilation)
}, {
  type: 'resource',
  name: 'plugin-live-reload:resource',
  provider: (compilation) => new LiveReloadResource(compilation)
}];

export { greenwoodPluginLivereload };
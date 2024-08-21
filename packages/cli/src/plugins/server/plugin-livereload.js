import fs from 'fs/promises';
import livereload from 'livereload';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { ServerInterface } from '../../lib/server-interface.js';

class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    const { userWorkspace, projectDirectory } = this.compilation.context;
    const standardPluginsDirectoryPath = new URL('../resource/', import.meta.url);
    const standardPluginsNames = (await fs.readdir(standardPluginsDirectoryPath))
      .filter(filename => filename.indexOf('plugin-standard') === 0);
    const standardPluginsExtensions = (await Promise.all(standardPluginsNames.map(async (filename) => {
      const pluginImport = await import(new URL(`./${filename}`, standardPluginsDirectoryPath));
      const plugin = pluginImport[Object.keys(pluginImport)[0]];

      return plugin;
    })))
      .filter(plugin => plugin.type === 'resource')
      .map((plugin) => plugin.provider(this.compilation).extensions || [].flat())
      .flat();
    const customPluginsExtensions = this.compilation.config.plugins
      .filter((plugin) => plugin.type === 'resource')
      .map((plugin) => {
        return plugin.provider(this.compilation).extensions || [].flat();
      }).flat();

    // filter out wildcards or otherwise undesired values and remove any . since livereload likes them that way
    const allExtensions = [
      ...standardPluginsExtensions,
      ...customPluginsExtensions,
      ...this.compilation.config.devServer.extensions
    ]
      .filter((ext) => ext !== '*' || ext !== '') // basic filter for false positives
      .filter((ext, idx, array) => array.indexOf(ext) === idx) // dedupe
      .map((ext) => ext.startsWith('.') ? ext.replace('.', '') : ext); // trim . from all entries

    const liveReloadServer = livereload.createServer({
      exts: allExtensions,
      applyCSSLive: false, // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
      applyImgLive: false // https://github.com/ProjectEvergreen/greenwood/issues/1263
    }, () => {
      const abridgedWorkspacePath = userWorkspace.pathname.replace(projectDirectory.pathname, '').replace('/', '');

      console.info(`Now watching workspace directory (./${abridgedWorkspacePath}) for changes...`);
    });

    liveReloadServer.watch(userWorkspace.pathname);
  }
}

class LiveReloadResource extends ResourceInterface {

  async shouldIntercept(url, request, response) {
    const contentType = response.headers.get('Content-Type');

    return contentType?.indexOf('text/html') >= 0 && process.env.__GWD_COMMAND__ === 'develop'; // eslint-disable-line no-underscore-dangle
  }

  async intercept(url, request, response) {
    let body = await response.text();

    body = body.replace('</head>', `
        <script src="http://localhost:35729/livereload.js?snipver=1"></script>
      </head>
    `);

    return new Response(body);
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
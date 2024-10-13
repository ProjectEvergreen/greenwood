/* eslint-disable max-depth */
import Koa from 'koa';
import { ServerInterface } from '../../lib/server-interface.js';
import { checkResourceExists } from '../../lib/resource-utils.js';
import { Readable } from 'stream';
import fs from 'fs/promises';

function pruneGraph(pages) {
  return pages.map(page => {
    const p = {
      ...page,
      title: page.title ?? page.label
    };

    delete p.resources;
    delete p.imports;

    return p;
  });
}

class ContentServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    const { contentAsData } = this.compilation.config;

    if (contentAsData) {
      const app = new Koa();
      const port = this.compilation.config.devServer.port + 1;

      app.use(async (ctx, next) => {
        try {
          if (ctx.request.path.startsWith('/graph.json')) {
            if (ctx.request.method === 'OPTIONS') {
              ctx.status = 200;
              ctx.message = 'OK';
              ctx.set('Access-Control-Allow-Origin', '*');
              ctx.set('Access-Control-Allow-Headers', '*');
            } else if (ctx.request.method === 'GET') {
              const { graph } = this.compilation;
              const contentKey = ctx.request.headers['x-content-key'] ?? '';

              if (contentKey === '') {
                ctx.status = 404;
                ctx.message = 'Not Found';
              } else {
                const keyPieces = contentKey.split('-');
                let body;

                if (contentKey === 'graph') {
                  body = graph;
                } else if (keyPieces[0] === 'collection') {
                  body = graph.filter(page => page?.data?.collection === keyPieces[1]);
                } else if (keyPieces[0] === 'route') {
                  body = graph.filter(page => page?.route.startsWith(keyPieces[1]));
                }

                if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
                  const fileKey = `./data-${contentKey.replace(/\//g, '_')}.json`;

                  if (!await checkResourceExists(new URL(fileKey, this.compilation.context.outputDir))) {
                    await fs.writeFile(new URL(fileKey, this.compilation.context.outputDir), JSON.stringify(pruneGraph(body)), 'utf-8');
                  }
                }

                ctx.body = Readable.from(JSON.stringify(pruneGraph(body)));
                ctx.status = 200;
                ctx.message = 'OK';
                ctx.set('Content-Type', 'application/json');
                ctx.set('Access-Control-Allow-Origin', '*');
                ctx.set('Access-Control-Allow-Headers', '*');
              }
            }
          }
        } catch (e) {
          ctx.status = 500;
          console.error(e);
        }

        await next();
      });

      await app.listen(port, () => {
        console.log(`Started content server at => http://localhost:${port}`);
      });
    }
  }
}

const greenwoodPluginContentServer = {
  type: 'server',
  name: 'plugin-content-server',
  provider: (compilation) => new ContentServer(compilation)
};

export { greenwoodPluginContentServer };
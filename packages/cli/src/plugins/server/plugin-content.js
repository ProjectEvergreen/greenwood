import Koa from 'koa';
import { ServerInterface } from '../../lib/server-interface.js';
import { Readable } from 'stream';

class ContentServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    const app = new Koa();

    app.use(async (ctx, next) => {
      try {
        if (ctx.request.path.startsWith('/graph.json')) {
          const { graph } = this.compilation;

          ctx.body = Readable.from(JSON.stringify(graph));
          ctx.status = 200;
          ctx.message = 'OK';

          ctx.set('Content-Type', 'application/json');
          ctx.set('Access-Control-Allow-Origin', '*');
        }
      } catch (e) {
        ctx.status = 500;
        console.error(e);
      }

      await next();
    });

    // TODO use dev server +1
    await app.listen('1985', () => {
      console.log('Started content server at => http://localhost:1985');
    });
  }
}

// TODO remove graph.json resolution from regular dev server?
const greenwoodPluginContentServer = {
  type: 'server',
  name: 'plugin-content-server',
  provider: (compilation) => new ContentServer(compilation)
};

export { greenwoodPluginContentServer };
/*
 *
 * Enables using JavaScript to import any type of file as a string using ESM syntax.
 *
 */
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportRawResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.contentType = 'text/javascript';
  }

  // TODO would be nice to have this instead
  // would need  to add resolve plugin lifecycles to rollup, custom loader, etc
  // async shouldResolve(url) {
  //   const matches = (this.options.matches || []).filter(matcher => url.href.indexOf(matcher) >= 0);

  //   if (matches.length > 0 && !url.searchParams.has('type')) {
  //     return true;
  //   }
  // }

  // async resolve(url) {
  //   const { pathname, searchParams } = url;
  //   const params = url.searchParams.size > 0
  //     ? `?${searchParams.toString()}&type=raw`
  //     : '?type=raw';
  //   const root = pathname.indexOf('node_modules') >= 0
  //     ? this.compilation.context.projectDirectory
  //     : this.compilation.context.userWorkspace;
  //   const matchedUrl = new URL(`.${pathname}${params}`, root);

  //   return new Request(matchedUrl);
  // }

  async shouldIntercept(url, request) {
    const matches = (this.options.matches || []).filter(matcher => url.href.indexOf(matcher) >= 0);
    const type = url.searchParams.get('type'); 
    const dest = request.headers.get('Sec-Fetch-Dest');

    return (url.protocol === 'file:' && type === 'raw' && dest === 'empty') || matches.length > 0;
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const contents = `const raw = \`${body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default raw;`;

    return new Response(contents, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}

const greenwoodPluginImportRaw = (options = {}) => {
  return [{
    type: 'resource',
    name: 'plugin-import-raw:resource',
    provider: (compilation) => new ImportRawResource(compilation, options)
  }];
};

export { greenwoodPluginImportRaw };
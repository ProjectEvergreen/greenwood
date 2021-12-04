import fs from 'fs';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { pathToFileURL } from 'url';

class IncludeHtmlResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.html'];
    this.contentType = 'text/html';
  }

  async shouldIntercept(url, body, headers) {
    return Promise.resolve(headers.response['content-type'] === this.contentType);
  }

  async intercept(url, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const includeLinksRegexMatches = body.match(/<link (.*)>/g);
        const includeCustomElementssRegexMatches = body.match(/<[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)>/g);

        if (includeLinksRegexMatches) {
          includeLinksRegexMatches
            .filter(link => link.indexOf('rel="html"') > 0)
            .forEach((link) => {
              const href = link.match(/href="(.*)"/)[1];
              const includeContents = fs.readFileSync(path.join(this.compilation.context.userWorkspace, href), 'utf-8');

              body = body.replace(link, includeContents);
            });
        }

        if (includeCustomElementssRegexMatches) {
          const customElementTags = includeCustomElementssRegexMatches.filter(customElementTag => customElementTag.indexOf('src=') > 0);

          for (const tag of customElementTags) {
            const src = tag.match(/src="(.*)"/)[1];
            const filepath = path.join(this.compilation.context.userWorkspace, this.getBareUrlPath(src.replace(/\.\.\//g, '')));
            const { getData, getTemplate } = await import(pathToFileURL(filepath));
            const includeContents = await getTemplate(await getData());

            body = body.replace(tag, includeContents);
          }
        }

        resolve({ body });
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginIncludeHTML = (options = {}) => [{
  type: 'resource',
  name: 'plugin-include-html',
  provider: (compilation) => new IncludeHtmlResource(compilation, options)
}];

export { greenwoodPluginIncludeHTML };
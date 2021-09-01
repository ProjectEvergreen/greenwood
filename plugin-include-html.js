/*
 * 
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const htmlparser = require('node-html-parser');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class IncludeHtmlCssResource extends ResourceInterface {
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
        // TODO html-parser can't "handle" malformed HTML?
        // "Per the design, it intends to parse massive HTML files in lowest price, thus the performance is the top priority. 
        // For this reason, some malformatted HTML may not be able to parse correctly, but most usual errors are covered (eg. HTML4 style no closing <li>, <td> etc).
        // https://github.com/ProjectEvergreen/greenwood/issues/627
        const root = htmlparser.parse(contents, {
          script: true,
          style: true,
          noscript: true,
          pre: true
        });
        const includeLinks = root.querySelectorAll('link');

        // --------

        const includeLinksRegexMatches = body.match(/<link (.*)><\/link>/g);

        if (includeLinksRegexMatches) {
          includeLinksRegexMatches
            .filter(link => link.indexOf('rel="html"') > 0)
            .forEach((link) => {
              const href = link.match(/href="(.*)"/)[1];
              const includeContents = fs.readFileSync(path.join(this.compilation.context.userWorkspace, href), 'utf-8');

              body = body.replace(link, includeContents);
            });
        }

        resolve({ body });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => [{
  type: 'resource',
  name: 'plugin-include-html',
  provider: (compilation) => new IncludeHtmlCssResource(compilation, options)
}];
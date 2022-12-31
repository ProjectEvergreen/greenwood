import fs from 'fs';

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
    this.contentType = ''; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  }

  hasExtension(url) {
    const extension = url.pathname.split('.').pop();

    return extension !== '' && !extension.startsWith('/');
  }

  // turn relative paths into relatively absolute based on a known root directory
  // * deep link route - /blog/releases/some-post
  // * and a nested path in the template - ../../styles/theme.css
  // so will get resolved as `${rootUrl}/styles/theme.css`
  resolveForRelativeUrl(url, rootUrl) {
    let reducedUrl;

    if (fs.existsSync(new URL(`.${url.pathname}`, rootUrl).pathname)) {
      return new URL(`.${url.pathname}`, rootUrl);
    }

    url.pathname.split('/')
      .filter((segment) => segment !== '')
      .reduce((acc, segment) => {
        const reducedPath = url.pathname.replace(`${acc}/${segment}`, '');

        if (reducedPath !== '' && fs.existsSync(new URL(`.${reducedPath}`, rootUrl).pathname)) {
          reducedUrl = new URL(`.${reducedPath}`, rootUrl);
        }
        return `${acc}/${segment}`;
      }, '');

    return reducedUrl;
  }

  // test if this plugin should change a relative URL from the browser to an absolute path on disk 
  // like for node_modules/ resolution. not commonly needed by most resource plugins
  // return true | false
  // eslint-disable-next-line no-unused-vars
  // async shouldResolve(url) {
  //   return Promise.resolve(false);
  // }

  // // return an absolute path
  // async resolve(url) {
  //   return Promise.resolve(url);
  // }

  // test if this plugin should be used to process a given url / header combo the browser and retu
  // ex: `<script type="module" src="index.ts">`
  // return true | false
  // eslint-disable-next-line no-unused-vars
  // async shouldServe(url, headers) {
  //   return Promise.resolve(this.extensions.indexOf(path.extname(url)) >= 0);
  // }

  // return the new body and / or contentType, e.g. convert file.foo -> file.js
  // eslint-disable-next-line no-unused-vars
  // async serve(url, headers) {
  //   return Promise.resolve({});
  // }

  // test if this plugin should return a new body for an already resolved resource
  // useful for modifying code on the fly without needing to read the file from disk
  // return true | false
  // eslint-disable-next-line no-unused-vars
  // async shouldIntercept(url, body, headers) {
  //   return Promise.resolve(false);
  // }

  // return the new body
  // eslint-disable-next-line no-unused-vars
  // async intercept(url, body, headers) {
  //   return Promise.resolve({ body });
  // }

  // test if this plugin should manipulate any files prior to any final optmizations happening 
  // ex: add a "banner" to all .js files with a timestamp of the build, or minifying files
  // return true | false
  // eslint-disable-next-line no-unused-vars
  // async shouldOptimize(url, body, headers) {
  //   return Promise.resolve(false);
  // }

  // return the new body
  // eslint-disable-next-line no-unused-vars
  // async optimize (url, body, headers) {
  //   return Promise.resolve(body);
  // }
}

export { ResourceInterface };
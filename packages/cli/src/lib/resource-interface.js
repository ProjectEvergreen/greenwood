import fs from 'fs';

class ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
    this.extensions = [];
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
}

export { ResourceInterface };
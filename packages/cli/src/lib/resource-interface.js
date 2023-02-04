import { checkResourceExists } from './resource-utils.js';

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
  async resolveForRelativeUrl(url, rootUrl) {
    const search = url.search || '';
    let reducedUrl;

    if (await checkResourceExists(new URL(`.${url.pathname}`, rootUrl))) {
      return new URL(`.${url.pathname}${search}`, rootUrl);
    }

    const segments = url.pathname.split('/').filter(segment => segment !== '');
    segments.shift();

    for (let i = 0, l = segments.length - 1; i < l; i += 1) {
      const nextSegments = segments.slice(i);
      const urlToCheck = new URL(`./${nextSegments.join('/')}`, rootUrl);

      if (await checkResourceExists(urlToCheck)) {
        reducedUrl = new URL(`${urlToCheck}${search}`);
      }
    }

    return reducedUrl;
  }
}

export { ResourceInterface };
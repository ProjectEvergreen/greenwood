import fs from 'fs/promises';

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
    let reducedUrl;
    let atRoot;

    try {
      await fs.access(new URL(`.${url.pathname}`, rootUrl));
      atRoot = true;
    } catch(e) {
      console.debug('reesolveFoRRelative', { e })
    }

    if (atRoot) {
      return new URL(`.${url.pathname}`, rootUrl);
    }

    url.pathname.split('/')
      .filter((segment) => segment !== '')
      .reduce(async (acc, segment) => {
        const reducedPath = url.pathname.replace(`${acc}/${segment}`, '');

        try {
          if(reducedPath !== '') {
            await fs.access(new URL(`.${reducedPath}`, rootUrl));
            reducedUrl = new URL(`.${reducedPath}`, rootUrl);
          }
        } catch(e) {
          console.debug('reesolveFoRRelative reducing', { e })
        }

        return `${acc}/${segment}`;
      }, '');

    return reducedUrl;
  }
}

export { ResourceInterface };
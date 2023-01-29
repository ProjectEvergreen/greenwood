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
    } catch (e) {
      // console.debug('reesolveFoRRelative', { e });
    }

    if (atRoot) {
      return new URL(`.${url.pathname}`, rootUrl);
    }

    const segments = url.pathname.split('/').filter(segment => segment !== '');
    segments.shift();

    for (let i = 0, l = segments.length - 1; i < l; i += 1) {
      try {
        const nextSegments = segments.slice(i);
        const urlToCheck = new URL(`./${nextSegments.join('/')}`, rootUrl);
        await fs.access(urlToCheck);
        reducedUrl = urlToCheck;
      } catch (e) {
        // console.debug('resolveForRelativeUrl trying again....');
      }
    }

    return reducedUrl;
  }
}

export { ResourceInterface };
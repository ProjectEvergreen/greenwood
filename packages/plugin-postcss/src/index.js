/*
 *
 * Enable using PostCSS process for CSS files.
 *
 */
import { checkResourceExists, normalizePathnameForWindows } from '@greenwood/cli/src/lib/resource-utils.js';
import postcss from 'postcss';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

async function getConfig (compilation, extendConfig = false) {
  const { projectDirectory } = compilation.context;
  const configFile = 'postcss.config';
  const defaultConfig = (await import(new URL(`./${configFile}.js`, import.meta.url))).default;
  const userConfigUrl = new URL(`./${configFile}.js`, projectDirectory);
  const userConfig = await checkResourceExists(userConfigUrl)
    ? (await import(userConfigUrl)).default
    : {};
  const finalConfig = Object.assign({}, userConfig);

  if (userConfig && extendConfig) {
    finalConfig.plugins = Array.isArray(userConfig.plugins)
      ? [...defaultConfig.plugins, ...userConfig.plugins]
      : [...defaultConfig.plugins];
  }

  return finalConfig;
}

class PostCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['css'];
    this.contentType = ['text/css'];
  }

  async shouldPreIntercept(url, request, response) {
    return url.protocol === 'file:'
      && url.pathname.split('.').pop() === this.extensions[0]
      && (request?.headers?.get('Content-Type')?.includes('text/css') || response?.headers?.get('Content-Type')?.includes('text/css'));
  }

  async preIntercept(url, request, response) {
    const config = await getConfig(this.compilation, this.options.extendConfig);
    const plugins = config.plugins || [];
    const body = await response.text();
    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: normalizePathnameForWindows(url) })).css
      : body;

    return new Response(css);
  }
}

const greenwoodPluginPostCss = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-postcss',
    provider: (compilation) => new PostCssResource(compilation, options)
  };
};

export { greenwoodPluginPostCss };
const greenwoodPluginRendererLit = (options = {}) => {
  return {
    type: 'renderer',
    name: 'plugin-renderer-lit',
    provider: () => {
      return {
        executeModuleUrl: new URL('./execute-route-module.js', import.meta.url),
        prerender: options.prerender
      };
    }
  };
};

export {
  greenwoodPluginRendererLit
};
const greenwoodPluginRendererString = {
  type: 'renderer',
  name: 'plugin-renderer-string',
  provider: () => {
    return {
      workerUrl: new URL('../../lib/ssr-route-worker.js', import.meta.url)
    };
  }
};

export { greenwoodPluginRendererString };
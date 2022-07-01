const greenwoodPluginRendererDefault = {
  type: 'renderer',
  name: 'plugin-renderer-default',
  provider: () => {
    return {
      workerUrl: new URL('../../lib/ssr-route-worker.js', import.meta.url)
    };
  }
};

export { greenwoodPluginRendererDefault };
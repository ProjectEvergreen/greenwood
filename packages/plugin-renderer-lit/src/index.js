const greenwoodPluginRendererLit = () => {
  return {
    type: 'renderer',
    name: 'plugin-renderer-lit',
    provider: () => {
      return {
        workerUrl: new URL('./ssr-route-worker-lit.js', import.meta.url)
      };
    }
  };
};

export {
  greenwoodPluginRendererLit
};
const greenwoodPluginRendererLit = () => {
  return {
    type: 'renderer',
    name: 'renderer-plugin-lit',
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
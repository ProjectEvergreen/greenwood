const greenwoodPluginRendererDefault = {
  type: 'renderer',
  name: 'plugin-renderer-default',
  provider: () => {
    return {
      executeModuleUrl: new URL('../../lib/execute-route-module.js', import.meta.url)
    };
  }
};

export { greenwoodPluginRendererDefault };
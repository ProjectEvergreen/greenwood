const greenwoodPluginRendererDefault = {
  type: 'renderer',
  name: 'plugin-renderer-default',
  provider: () => {
    return {
      executeRouteModuleUrl: new URL('../../lib/execute-route-module.js', import.meta.url)
    };
  }
};

export { greenwoodPluginRendererDefault };
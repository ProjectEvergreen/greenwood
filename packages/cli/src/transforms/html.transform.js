// eslint-disable-next-line no-unused-vars
const { getAppTemplate, getAppTemplateScripts, getUserScripts, getMetaContent } = require('./tools.transform');

module.exports = filterHTML = async (ctx, config, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO filter out node modules, only page / user requests from brower
      // TODO make sure this only happens for "pages", nor partials or fixtures, templates, et)
      if (ctx.url.endsWith('/') || ctx.url.endsWith('.html')) {
        // TODO get pages path from compilation
        const barePath = ctx.url.endsWith('/')
          ? `${userWorkspace}/pages${ctx.url}index`
          : `${userWorkspace}/pages${ctx.url.replace('.html', '')}`;

        contents = await getAppTemplate(barePath);
        contents = await getAppTemplateScripts(userWorkspace);
        contents = getUserScripts(contents, userWorkspace);
        contents = getMetaContent(ctx, config, contents);

        ctx.set('Content-Type', 'text/html');
        ctx.body(contents);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const { promises: fsp } = require('fs');
const fs = require('fs');
const frontmatter = require('front-matter');
const remarkFrontmatter = require('remark-frontmatter');
const raw = require('rehype-raw');
const html = require('rehype-stringify');
const remark = require('remark-parse');
const remark2rehype = require('remark-rehype');
const unified = require('unified');

const { getAppTemplate, getAppTemplateScripts, getUserScripts, getMetaContent } = require('./tools.transform');

module.exports = filterMarkdown = async (ctx, config, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (ctx.url.endsWith('/') || ctx.url.endsWith('.html')) {
        
        const markdownPath = ctx.url.endsWith('/')
          ? `${userWorkspace}/pages${ctx.url}index.md`
          : `${userWorkspace}/pages${ctx.url.replace('.html', '.md')}`;

        if (fs.existsSync(markdownPath)) {
          contents = await getAppTemplate(markdownPath);
          const markdownContents = await fsp.readFile(markdownPath, 'utf-8');
      
          // console.debug('this route exists as a markdown file', markdownPath);
      
          // TODO extract front matter contents from remark-frontmatter instead of frontmatter lib
          // TODO handle prism
          const fm = frontmatter(markdownContents);
          const processedMarkdown = await unified()
            .use(remark)
            .use(remarkFrontmatter)
            .use(remark2rehype, { allowDangerousHtml: true })
            .use(raw)
            .use(html)
            .process(markdownContents);
      
          // TODO use an app template
          if (fm.attributes.template) {
            contents = await fsp.readFile(`${userWorkspace}/templates/${fm.attributes.template}.html`, 'utf-8');
          } else if (fs.existsSync(`${userWorkspace}/templates/page.html`)) {
            contents = await fsp.readFile(`${userWorkspace}/templates/page.html`, 'utf-8');
          }
      
          // use page title
          let title = config.title;
          if (fm.attributes.title) {
            title = `${title} - ${fm.attributes.title}`;
          }
          config.title = title;
      
          contents = await getAppTemplateScripts(userWorkspace);
      
          contents = getUserScripts(contents, userWorkspace);
          contents = contents.replace('<content-outlet></content-outlet>', processedMarkdown.contents);
          contents = getMetaContent(ctx, config, contents);
          ctx.set('Content-Type', 'text/html');
          ctx.body(contents);
        }
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
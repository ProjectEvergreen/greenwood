const { promises: fsp } = require('fs');
const fs = require('fs');
const frontmatter = require('front-matter');
const remarkFrontmatter = require('remark-frontmatter');
const raw = require('rehype-raw');
const html = require('rehype-stringify');
const remark = require('remark-parse');
const remark2rehype = require('remark-rehype');
const unified = require('unified');

const TransformInterface = require('./transform.interface');
const { getAppTemplate, getAppTemplateScripts, getUserScripts, getMetaContent } = require('./transform.tools');

module.exports = class TransformHtml extends TransformInterface {

  constructor(req, compilation) {
    super(req, compilation, ['.md']);
  }

  shouldTransform() {
    const { url } = this.request;

    return url.endsWith('/') || url.endsWith('.html');
  }

  async applyTransform() {
    return new Promise(async (resolve, reject) => {
      try {
       
        let body = '';
        const { url } = this.request;
        const markdownPath = url.endsWith('/')
          ? `${this.workspace}/pages${url}index.md`
          : `${this.workspace}/pages${url.replace('.html', '.md')}`;

        if (fs.existsSync(markdownPath)) {
          body = await getAppTemplate(markdownPath);
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
            body = await fsp.readFile(`${this.workspace}/templates/${fm.attributes.template}.html`, 'utf-8');
          } else if (fs.existsSync(`${this.workspace}/templates/page.html`)) {
            body = await fsp.readFile(`${this.workspace}/templates/page.html`, 'utf-8');
          }
      
          // use page title
          let title = this.config.title;
          if (fm.attributes.title) {
            title = `${title} - ${fm.attributes.title}`;
          }
          this.config.title = title;

          const contentType = 'text/html';
      
          body = await getAppTemplateScripts(body, this.workspace);
          body = getUserScripts(body, this.workspace);
          body = body.replace('<content-outlet></content-outlet>', processedMarkdown.contents);
          body = getMetaContent(url, this.config, body);

          resolve({
            body,
            contentType,
            extension: '.md'
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }
};
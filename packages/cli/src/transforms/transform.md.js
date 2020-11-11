const { promises: fsp } = require('fs');
const fs = require('fs');
const frontmatter = require('front-matter');
const remarkFrontmatter = require('remark-frontmatter');
const rehypeStringify = require('rehype-stringify');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

const TransformInterface = require('./transform.interface');
const { getAppTemplateScripts, getUserScripts, getMetaContent } = require('./transform.tools');

class MDTransform extends TransformInterface {

  constructor(req) {
    super(req, ['.md']);
  }

  shouldTransform() {
    const { request, workspace } = this;
    const { url } = request;

    const barePath = url.endsWith('/')
      ? `${workspace}/pages${url}index`
      : `${workspace}/pages${url.replace('.html', '')}`;

    return fs.existsSync(`${barePath}.md`) || fs.existsSync(`${barePath.replace('/index', '.md')}`);
  }

  async applyTransform() {
    const { config, workspace, request } = this;
    const { url } = request;
    let contents = '', title = config.title || '';

    return new Promise(async (resolve, reject) => {
      try {
        
        const barePath = url.endsWith('/')
          ? `${workspace}/pages${url}index`
          : `${workspace}/pages${url.replace('.html', '')}`;
          
        // TODO all this lookup could probably be handled a bit more gracefully perhaps?
        // console.debug('this route exists as markdown');
        const markdownPath = fs.existsSync(`${barePath}.md`)
          ? `${barePath}.md`
          : fs.existsSync(`${barePath.replace('/index', '.md')}`)
            ? `${barePath.replace('/index', '.md')}`
            : `${workspace}/pages${url.replace('/index.html', '.md')}`;
        const markdownContents = await fsp.readFile(markdownPath, 'utf-8');

        const rehypePlugins = [];
        const remarkPlugins = [];

        config.markdown.plugins.forEach(plugin => {
          if (plugin.indexOf('rehype-') >= 0) {
            rehypePlugins.push(require(plugin));
          }

          if (plugin.indexOf('remark-') >= 0) {
            remarkPlugins.push(require(plugin));
          }
        });

        // TODO extract front matter contents from remark-frontmatter instead of frontmatter lib
        const fm = frontmatter(markdownContents);
        const processedMarkdown = await unified()
          .use(remarkParse) // parse markdown into AST
          .use(remarkFrontmatter) // extract frontmatter from AST
          .use(...remarkPlugins) // apply userland remark plugins
          .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
          .use(...rehypePlugins) // apply userland rehype plugins
          .use(rehypeStringify) // convert AST to HTML string
          .process(markdownContents);

        // TODO use an app template
        if (fm.attributes.template) {
          contents = await fsp.readFile(`${workspace}/templates/${fm.attributes.template}.html`, 'utf-8');
        } else if (fs.existsSync(`${workspace}/templates/page.html`)) {
          // console.debug('has a page template!');
          contents = await fsp.readFile(`${workspace}/templates/page.html`, 'utf-8');
        }

        // use page title
        if (fm.attributes.title) {
          title = `${title} - ${fm.attributes.title}`;
        }

        let body = await getAppTemplateScripts(contents, workspace);
        body = getUserScripts(body, workspace);
        body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, processedMarkdown.contents);
        body = getMetaContent(url, config, body);

        resolve({
          body,
          contentType: this.contentType,
          extension: this.extensions
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = MDTransform;
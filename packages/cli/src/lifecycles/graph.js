#!/usr/bin/env node
const fs = require('fs');
const fm = require('front-matter');
const toc = require('markdown-toc');

module.exports = generateGraph = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { context } = compilation;
      const { pagesDir } = context;

      const walkDirectoryForPages = function(directory, pages = []) {
        
        fs.readdirSync(directory).forEach((filename) => {
          const fullPath = `${directory}/${filename}`.replace('//', '/');
          
          if (fs.statSync(fullPath).isDirectory()) {
            pages = walkDirectoryForPages(fullPath, pages);
          } else {
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { attributes } = fm(fileContents);
            const relativePagePath = fullPath.substring(pagesDir.length - 1, fullPath.length);
            const relativeWorkspacePath = directory.replace(process.cwd(), '').replace('/', '');
            const template = attributes.template || 'page';
            const title = attributes.title || compilation.config.title || '';
            const label = attributes.label || filename.split('/')[filename.split('/').length - 1].replace('.md', '').replace('.html', '');
            let route = relativePagePath.replace('.md', '').replace('.html', '');

            /*
             * check if additional nested directories exist to correctly determine route (minus filename)
             * examples:
             * - pages/index.{html,md} -> /
             * - pages/about.{html,md} -> /about/
             * - pages/blog/index.{html,md} -> /blog/
             * - pages/blog/some-post.{html,md} -> /blog/some-post/
             */
            if (relativePagePath.lastIndexOf('/') > 0) {
              // https://github.com/ProjectEvergreen/greenwood/issues/455
              route = label === 'index'
                ? `${route.replace('/index', '')}/`
                : `${route}/`;
            } else {
              route = route === '/index'
                ? '/'
                : `${route}/`;
            }

            // prune "reserved" attributes that are supported by Greenwood
            // https://www.greenwoodjs.io/docs/front-matter
            const customData = attributes;

            delete customData.label;
            delete customData.imports;
            delete customData.title;
            delete customData.template;

            /* Menu Query
             * Custom front matter - Variable Definitions
             * --------------------------------------------------
             * menu: the name of the menu in which this item can be listed and queried
             * index: the index of this list item within a menu
             * linkheadings: flag to tell us where to add page's table of contents as menu items
             * tableOfContents: json object containing page's table of contents(list of headings)
             */
            // set specific menu to place this page
            customData.menu = customData.menu || '';

            // set specific index list priority of this item within a menu
            customData.index = customData.index || '';

            // set flag whether to gather a list of headings on a page as menu items
            customData.linkheadings = customData.linkheadings || 0;
            customData.tableOfContents = [];

            if (customData.linkheadings > 0) {
              // parse markdown for table of contents and output to json
              customData.tableOfContents = toc(fileContents).json;
              customData.tableOfContents.shift();
            }
            /* ---------End Menu Query-------------------- */

            /*
             * Graph Properties (per page)
             *----------------------
             * data: custom page frontmatter
             * filename: name of the file
             * label: text representation of the filename
             * path: path to the file relative to the workspace
             * route: URL route for a given page on outputFilePath
             * template: page template to use as a base for a generated component
             * title: a default value that can be used for <title></title>
             */
            pages.push({
              data: customData || {},
              filename,
              label,
              path: route === '/' || relativePagePath.lastIndexOf('/') === 0
                ? `${relativeWorkspacePath}${filename}`
                : `${relativeWorkspacePath}/${filename}`,
              route,
              template,
              title
            });
          }
        });

        return pages;
      };

      const graph = fs.existsSync(pagesDir)
        ? walkDirectoryForPages(pagesDir)
        : [{ route: '/' }];

      compilation.graph = graph;

      if (!fs.existsSync(context.scratchDir)) {
        await fs.promises.mkdir(context.scratchDir);
      }

      await fs.promises.writeFile(`${context.scratchDir}/graph.json`, JSON.stringify(compilation.graph));

      resolve(compilation);
    } catch (err) {
      reject(err);
    }

  });
};
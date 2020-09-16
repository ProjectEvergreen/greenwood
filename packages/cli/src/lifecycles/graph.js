#!/usr/bin/env node
const fs = require('fs-extra');
const crypto = require('crypto');
// const fm = require('front-matter');
// const path = require('path');
// const toc = require('markdown-toc');

const createGraphFromPages = async (pagesDir, config) => {
  let pages = [];

  return new Promise(async (resolve, reject) => {
    try {
      const pagesIndexMap = new Map();
      let pagesIndex = 0;

      const walkDirectory = async(directory) => {
        let files = await fs.readdir(directory);

        return Promise.all(files.map((file) => {
          console.debug('walking files, on page', file);
          // const filenameHash = crypto.createHash('md5').update(`${directory}/${file}`).digest('hex');
          // const filePath = path.join(directory, file);
          // const stats = fs.statSync(filePath);
          // const isMdFile = file.substr(file.length - 2, file.length) === 'md';

          // // map each page to a (0 based) index based on filesystem order
          // if (isMdFile) {
          //   pagesIndexMap.set(filenameHash, pagesIndex);
          //   pagesIndex += 1;
          // }

          // return new Promise(async (resolve, reject) => {
          //   try {

          //     if (isMdFile && !stats.isDirectory()) {
          //       const fileContents = await fs.readFile(filePath, 'utf8');
          //       const { attributes } = fm(fileContents);
          //       let { label, template, title } = attributes;
          //       let { meta } = config;
          //       let mdFile = '';

          //       // if template not set, use default
          //       template = template || 'page';

          //       // get remaining string after user's pages directory
          //       let subDir = filePath.substring(pagesDir.length - 1, filePath.length);

          //       // get index of seperator between remaining subdirectory and the file's name
          //       const seperatorIndex = subDir.lastIndexOf('/');

          //       // get md file's name with extension (for generating to scratch)
          //       let fileName = subDir.substring(seperatorIndex + 1, subDir.length - 3);

          //       // get md file's name without the file extension
          //       let fileRoute = subDir.substring(seperatorIndex, subDir.length - 3);

          //       // determine if this is an index file, if so set route to '/'
          //       let route = fileRoute === '/index' ? '/' : fileRoute;

          //       // check if additional nested directories
          //       if (seperatorIndex > 0) {
          //         // get all remaining nested page directories
          //         completeNestedPath = subDir.substring(0, seperatorIndex);

          //         // set route to the nested pages path and file name(without extension)
          //         route = completeNestedPath + route;
          //         mdFile = `.${completeNestedPath}${fileRoute}.md`;
          //         relativeExpectedPath = `'..${completeNestedPath}/${fileName}/${fileName}.js'`;
          //       } else {
          //         mdFile = `.${fileRoute}.md`;
          //         relativeExpectedPath = `'../${fileName}/${fileName}.js'`;
          //       }

          //       // generate a random element tag name
          //       label = label || generateLabelHash(filePath);

          //       // set <title></title> element text, override with markdown title
          //       title = title || '';

          //       // create webpack chunk name based on route and page name
          //       const routes = route.lastIndexOf('/') === route.length - 1 && route.lastIndexOf('/') > 0
          //         ? route.substring(1, route.length - 1).split('/')
          //         : route.substring(1, route.length).split('/');
          //       let chunkName = 'page';

          //       routes.forEach(subDir => {
          //         chunkName += '--' + subDir;
          //       });

          //       /*
          //       * Variable Definitions
          //       *----------------------
          //       * data: custom frontmatter set per page within frontmatter
          //       * mdFile: path for an md file which will be imported in a generated component
          //       * label: the unique label given to generated component element e.g. <wc-md-somelabel></wc-md-somelabel>
          //       * route: route for a given page's url
          //       * template: page template to use as a base for a generated component (auto appended by -template.js)
          //       * filePath: complete absolute path to a md file
          //       * fileName: file name without extension/path, so that it can be copied to scratch dir with same name
          //       * relativeExpectedPath: relative import path for generated component within a list.js file to later be
          //       * imported into app.js root component
          //       * title: the head <title></title> text
          //       * meta: og graph meta array of objects { property/name, content }
          //       * chunkName: generated chunk name for webpack bundle
          //       */
          //       const customData = attributes;

          //       // prune "reserved" attributes that are supported by Greenwood
          //       // https://www.greenwoodjs.io/docs/front-matter
          //       delete customData.label;
          //       delete customData.imports;
          //       delete customData.title;
          //       delete customData.template;

          //       /* Menu Query
          //       * Custom front matter - Variable Definitions
          //       * --------------------------------------------------
          //       * menu: the name of the menu in which this item can be listed and queried
          //       * index: the index of this list item within a menu
          //       * linkheadings: flag to tell us where to add page's table of contents as menu items
          //       * tableOfContents: json object containing page's table of contents(list of headings)
          //       */
          //       // set specific menu to place this page
          //       customData.menu = customData.menu || '';

          //       // set specific index list priority of this item within a menu
          //       customData.index = customData.index || '';

          //       // set flag whether to gather a list of headings on a page as menu items
          //       customData.linkheadings = customData.linkheadings || 0;
          //       customData.tableOfContents = [];

          //       // TODO
          //       // if (customData.linkheadings > 0) {
          //       //   // parse markdown for table of contents and output to json
          //       //   customData.tableOfContents = toc(fileContents).json;
          //       //   customData.tableOfContents.shift();
          //       // }
          //       /* ---------End Menu Query-------------------- */

          //       pages[pagesIndexMap.get(filenameHash)] = {
          //         data: customData || {},
          //         mdFile,
          //         label,
          //         route,
          //         template,
          //         filePath,
          //         fileName,
          //         relativeExpectedPath,
          //         title,
          //         meta,
          //         chunkName
          //       };
          //     }

          //     if (stats.isDirectory()) {
          //       await walkDirectory(filePath);
          //       resolve();
          //     }
          //     resolve();
          //   } catch (err) {
          //     reject(err);
          //   }
          // });
        }));
      };

      await walkDirectory(pagesDir);
      resolve(pages);
    } catch (err) {
      reject(err);
    }
  });
};

const generateLabelHash = (label) => {
  const hash = crypto.createHash('sha256');

  hash.update(label);

  let elementLabel = hash.digest('hex');

  elementLabel = elementLabel.substring(elementLabel.length - 15, elementLabel.length);

  return elementLabel;
};

module.exports = generateGraph = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { context, config } = compilation;

      compilation.graph = await createGraphFromPages(context.pagesDir, config);

      resolve(compilation);
    } catch (err) {
      reject(err);
    }

  });
};
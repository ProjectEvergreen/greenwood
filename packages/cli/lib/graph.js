#!/usr/bin/env node
const fs = require('fs');
const fm = require('front-matter');
const path = require('path');
const util = require('util');

const createGraphFromPages = async (pagesDir) => {
  let pages = [];
  const readdir = util.promisify(fs.readdir);
  const readFile = util.promisify(fs.readFile);

  return new Promise(async (resolve, reject) => {
    try {

      const walkDirectory = async(directory) => {
        let files = await readdir(directory);

        return Promise.all(files.map(async (file) => {
          return new Promise(async (resolve, reject) => {
            try {
              const filePath = path.join(directory, file);
              const stats = await fs.statSync(filePath);
              const isMdFile = file.substr(file.length - 2, file.length) === 'md';

              if (isMdFile && !stats.isDirectory()) {
                const data = await readFile(filePath, 'utf8');
                const { attributes } = fm(data);
                let { label, template } = attributes;
                let mdFile = '';

                // get remaining string after user's pages directory
                let subDir = filePath.substring(pagesDir.length, filePath.length);

                // get index of seperator between remaining subdirectory and the file's name
                const seperatorIndex = subDir.lastIndexOf('/');

                // get md file's name without the file extension
                let fileRoute = subDir.substring(seperatorIndex, subDir.length - 3);
                
                // determine if this is an index file, if so set route to '/'
                let route = fileRoute === '/index' ? '/' : fileRoute;
      
                // check if additional nested directories
                if (seperatorIndex > 0) {
                  // get all remaining nested page directories
                  completeNestedPath = subDir.substring(0, seperatorIndex);

                  // set route to the nested pages path and file name(without extension)
                  route = completeNestedPath + route;
                  mdFile = `.${completeNestedPath}${fileRoute}.md`;
                  relativeExpectedPath = `'..${completeNestedPath}/${label}/${label}.js'`; 
                } else {
                  mdFile = `.${fileRoute}.md`;
                  relativeExpectedPath = `'../${label}/${label}.js'`; 
                }
                
                /*
                * Variable Definitions
                *----------------------
                * mdFile: a path for an md file which will be imported in a generated component
                * label: the unique label we're giving for the generated web component 
                * e.g. <wc-md-somelabel></wc-md-somelabel>
                * route: route for a given page's url
                * template: page template to use as a base for a generated component (auto appended by -template.js)
                * filePath: complete absolute path to a md file
                * relativeExpectedPath: a relative import path for the generated component into a list.js file 
                * to later be imported into app.js root component
                */

                pages.push({ mdFile, label, route, template, filePath, relativeExpectedPath });
              }
              if (stats.isDirectory()) {
                await walkDirectory(filePath);
                resolve();
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        }));
      };

      await walkDirectory(pagesDir);
      resolve(pages);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateGraph = async (config) => {

  return new Promise(async (resolve, reject) => {
    try {
      const graph = await createGraphFromPages(config.pagesDir);

      resolve(graph);
    } catch (err) {
      reject(err);
    }

  });
};
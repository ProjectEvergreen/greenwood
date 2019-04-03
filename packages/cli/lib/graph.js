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
      
              if (file.substr(file.length - 2, file.length) === 'md' && !stats.isDirectory()) {
                const data = await readFile(filePath, 'utf8');
                const { attributes } = fm(data);
                let { label, path, template } = attributes;
                let subDir = filePath.substring(pagesDir.length, filePath.length);
                const folder = subDir.lastIndexOf('/');
                let fileName = file.substring(folder, file.length);
                let imprt = '';

                if (folder > 0) {
                  subDir = subDir.substring(0, folder);
                  fileName = file.substring(file.length - folder, file.length);
                  path = subDir + path;
                  imprt = `.${subDir}/${label}.md`;
                  relativeExpectedPath = `'..${subDir}/${label}/${label}.js'`; 
                } else {
                  imprt = `./${label}.md`;
                  relativeExpectedPath = `'../${label}/${label}.js'`; 
                }
                
                pages.push({ import: imprt, label, path, template, filePath, fileName, relativeExpectedPath });
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
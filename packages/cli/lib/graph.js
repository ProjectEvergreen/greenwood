#!/usr/bin/env node
require('colors');
const fs = require('fs');
const fm = require('front-matter');

const walkDirectory = async (path) => {
  let pages = [];

  return new Promise(async (resolve, reject) => {
    try {
      await fs.readdirSync(path).forEach(async (file) => {
        const filePath = path.join(path, file);
        const stats = await fs.statSync(filePath);

        if (file.substr(file.length - 2, file.length) === 'md' && !stats.isDirectory()) {
          const data = await fs.readFileSync(filePath, 'utf8');
          const { attributes } = fm(data);
          const { label, path, template } = attributes;
          // TOOD establish defaults here, infer from filesystem, assume it's a page

          // TOOD probably dont want to hardcode pages
          pages.push({ import: '../pages/' + file, label, path, template });
          resolve(pages);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateGraph = async (config, compilation) => {
  let graph = {};

  return new Promise(async (resolve, reject) => {
    try {
      console.log('Generate graph...');
      if (fs.existsSync(config.src)) {
        graph = await walkDirectory(config.src);
      } else {
        graph = compilation.graph;
      }

      console.log('Graph complete.');
      resolve(graph);
    } catch (err) {
      reject(err);
    }

  });
};
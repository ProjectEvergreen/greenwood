#!/usr/bin/env node
const fs = require('fs');
const fm = require('front-matter');
const path = require('path');

const createGraphFromPages = async (pagesDir) => {
  let pages = [];

  return new Promise(async (resolve, reject) => {
    try {
      await fs.readdirSync(pagesDir).forEach(async (file) => {
        const filePath = path.join(pagesDir, file);
        const stats = await fs.statSync(filePath);

        if (file.substr(file.length - 2, file.length) === 'md' && !stats.isDirectory()) {
          const data = await fs.readFileSync(filePath, 'utf8');
          const { attributes } = fm(data);
          const { label, path, template } = attributes;

          // TOOD probably dont want to hardcode pages do we?
          pages.push({ import: `./${file}/${file}`, label, path, template });
        }
      });

      resolve(pages);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateGraph = async (config, compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const graph = await createGraphFromPages(config.pagesDir);

      resolve(graph);
    } catch (err) {
      reject(err);
    }

  });
};
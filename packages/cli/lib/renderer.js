const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');
const { Renderer } = require('./rendertron');
const fs = require('fs');
const path = require('path');

module.exports = async (absPath, label) => {

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const renderer = new Renderer(browser);

  let result = await renderer.serialize(absPath);

  const dom = new JSDOM(result.content);

  const target = path.resolve(__dirname, '../public', label);

  if (label !== 'index') {
    await fs.mkdirSync(target, { recursive: true });
    return await fs.writeFileSync(path.resolve(__dirname, '../public/', label, 'index.html'), dom.serialize());
  }
  return await fs.writeFileSync(path.resolve(__dirname, '../public/', 'index.html'), dom.serialize());
};
const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');
const { Renderer } = require('./renderer');
const fs = require('fs');
const path = require('path');

module.exports = async (url, label, route, outputDirectory) => {  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const renderer = new Renderer(browser);
  const result = await renderer.serialize(url);
  
  const dom = new JSDOM(result.content);
  const html = dom.serialize();
  const target = path.join(outputDirectory, route);

  if (label !== 'index') {
    await fs.mkdirSync(target, { recursive: true });
    return await fs.writeFileSync(path.join(target, 'index.html'), html);
  }
  return await fs.writeFileSync(path.join(outputDirectory, 'index.html'), html);
};
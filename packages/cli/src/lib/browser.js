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
  const html = result.content;
  const target = path.join(outputDirectory, route);
  
  await fs.mkdirSync(target, { recursive: true });

  return await fs.writeFileSync(path.join(target, 'index.html'), html);
};
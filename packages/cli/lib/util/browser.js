const { JSDOM } = require('jsdom');
const puppeteer = require('puppeteer');
const { Renderer } = require('./renderer');
const fs = require('fs');
const path = require('path');

module.exports = async (absPath, label) => {
  console.log('absPath', absPath);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const renderer = new Renderer(browser);

  let result = await renderer.serialize(absPath);
  console.log('result', result);

  const dom = new JSDOM(result.content);
  // console.log('dom', dom);

  const target = path.resolve(process.cwd(), './.greenwood', label);
  console.log('target', target);

  if (label !== 'index') {
    await fs.mkdirSync(target, { recursive: true });
    return await fs.writeFileSync(path.resolve(process.cwd(), './public/', label, 'index.html'), dom.serialize());
  }
  return await fs.writeFileSync(path.resolve(process.cwd(), './public/', 'index.html'), dom.serialize());
};
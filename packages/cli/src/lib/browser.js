const puppeteer = require('puppeteer');
const { Renderer } = require('./renderer');

module.exports = async (url) => {  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const renderer = new Renderer(browser);

  return await renderer.serialize(url);
};
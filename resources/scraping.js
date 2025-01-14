const { timeout } = require('puppeteer');
const { solveCaptcha } = require('./with2captcha');
const { humanBypassCaptcha } = require('./without2captcha');

/**
 * @param {import('puppeteer')} p
 */
const initialize = async (p) => {
  const browser = await p.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const x = ['rata blanca', 'mujer amante', 'mago de oz', 'cannibal corpse'];
  await page.goto('https://quotes.toscrape.com/login', { timeout: 150000 });
  for (i of x) {
    await page.type('#username', i);
  }
};

module.exports = { initialize };

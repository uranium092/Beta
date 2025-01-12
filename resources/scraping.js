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
  await page.goto('https://miclaroapp.com.co/');
  await page.type("input[placeholder='Escribe tu correo electrónico']", process.env.USERNAME_CLARO);
  await page.type("input[placeholder='Escribe tu contraseña']", process.env.PASSWORD_CLARO);
  if (process.env.WITH2CAPTCHA === 'false') {
    await humanBypassCaptcha();
  } else {
    await solveCaptcha();
  }
  await Promise.all([
    page.click('#login'),
    page.waitForNavigation({ waitUntil: 'load', timeout: 150000 }),
  ]);

  const invoice = await page.waitForSelector(
    "::-p-xpath(//div[@id='trancicionbgcorange']//p[text()='Paga tu Factura'])",
    { timeout: 120000 }
  );

  await Promise.all([
    invoice.click(),
    page.waitForNavigation({ waitUntil: 'load', timeout: 150000 }),
  ]);

  const external = await page.waitForSelector('.tambienpuedes-card:nth-child(4) > .m0', {
    timeout: 120000,
  });

  await Promise.all([
    external.click(),
    page.waitForNavigation({ waitUntil: 'load', timeout: 150000 }),
  ]);
};

module.exports = { initialize };

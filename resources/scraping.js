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
  await page.goto('https://miclaroapp.com.co/', { timeout: 150000, waitUntil: 'load' });

  await page.type("input[placeholder='Escribe tu correo electrónico']", process.env.USERNAME_CLARO);

  await page.type("input[placeholder='Escribe tu contraseña']", process.env.PASSWORD_CLARO);
  if (process.env.WITH2CAPTCHA === 'false') {
    await humanBypassCaptcha();
  } else {
    await solveCaptcha(p);
  }
  await page.click('#login');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 150000 });
  const invoice = await page.waitForSelector(
    "::-p-xpath(//div[@id='trancicionbgcorange']//p[text()='Paga tu Factura'])",
    { visible: true }
  );
  await invoice.click();
  await page.locator('.tambienpuedes-card:nth-of-type(4)').click();
};

module.exports = { initialize };

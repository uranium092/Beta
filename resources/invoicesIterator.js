const path = require('path');
const fs = require('fs');

const goToSearchPage = async (page) => {
  const invoice = await page.waitForSelector(
    "::-p-xpath(//div[@id='trancicionbgcorange']//p[text()='Paga tu Factura'])",
    { visible: true }
  );
  await invoice.click();
  await page.locator('.tambienpuedes-card:nth-of-type(4)').click();
};

/**
 * @param {import('puppeteer').Page} pp
 */
const invoicesIterator = async (pp) => {
  const filePath = path.join(__dirname, '/../files/input.txt');
  const data = fs
    .readFileSync(filePath, { encoding: 'utf8', flag: 'r' })
    .split('\n')
    .map((val, trustPosition) => ({ val, trustPosition }));
  const filePathOut = path.join(__dirname, '/../files/output.txt');
  let out;
  try {
    out = fs.createWriteStream(filePathOut, {
      flags: 'a',
    });
  } catch (err) {
    console.error('===ERROR===', err.message);
    return process.exit();
  }
  let lastIndex = 0;

  while (true) {
    await goToSearchPage(pp);
    const arr = data.slice(lastIndex);
    let needSpeedBreakLoop = true;
    for (let index = 0; index < arr.length; index++) {
      const { trustPosition, val } = arr[index];
      try {
        const inv = val.substring(0, 10).replaceAll(/\D/g, '');
        if (inv.length !== 10) {
          throw new Error('Invalid number');
        }
        await pp.locator('.p7');
        await pp.evaluate(() => (document.querySelector('.p7').value = ''));
        await pp.type('.p7', inv);
        await Promise.all([
          pp.waitForResponse(
            async (response) => {
              if (response.url().includes('Proxy/getsetwspost.php')) {
                const claro = await response.json();
                if (claro?.error === 1 && claro?.response.includes('documentos para la cuenta')) {
                  await pp.waitForFunction(() => {
                    const modal = document.querySelector('.sweet-alert');
                    return modal.classList.contains('visible');
                  });
                  const btn = await pp.$('.sweet-alert > div.sa-button-container > div > button');
                  await btn.evaluate((el) => el.click());
                  await pp.waitForFunction(() => {
                    const modal = document.querySelector('.sweet-alert');
                    return !modal.classList.contains('visible') || modal.style.display === 'none';
                  });
                  return true;
                }
                const val = claro?.response?.facturaActual?.valor;
                if (val == 0) {
                  const BOT_MODE = process.env.BOT_MODE;
                  if (BOT_MODE === 'AGGRESSIVE') {
                    await pp.waitForFunction(() => {
                      const modal = document.querySelector('.sweet-alert');
                      return modal.classList.contains('visible');
                    });
                    const btn = await pp.$('.sweet-alert > div.sa-button-container > div > button');
                    await btn.evaluate((el) => el.click());
                    await pp.waitForFunction(() => {
                      const modal = document.querySelector('.sweet-alert');
                      return !modal.classList.contains('visible') || modal.style.display === 'none';
                    });
                  } else {
                    lastIndex = trustPosition + 1;
                    needSpeedBreakLoop = false;
                  }
                  return true;
                }
                if (val) {
                  out.write(`${inv} ${val}\n`);
                  return true;
                }
                return true;
              }
              return false;
            },
            { timeout: 60000 }
          ),
          pp.click('.bgbluelight'),
        ]);
        pp.removeAllListeners('response');
        if (!needSpeedBreakLoop) {
          break;
        }
        await new Promise((resolve, reject) => setTimeout(() => resolve(), 2500));
      } catch (err) {
        needSpeedBreakLoop = false;
        lastIndex = trustPosition;
        break;
      }
    }
    if (needSpeedBreakLoop) {
      break;
    }
    await pp.reload({ waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 150000 });
  }
};

module.exports = { invoicesIterator };

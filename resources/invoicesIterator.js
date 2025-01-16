const path = require('path');
const fs = require('fs');

/**
 * @param {import('puppeteer').Page} pp
 */
const invoicesIterator = async (pp) => {
  const filePath = path.join(__dirname, '/../files/input.txt');
  fs.readFile(filePath, 'utf-8', async (err, data) => {
    if (err) {
      console.log('===ERROR===', err.message);
      return process.exit();
    }
    data = data.split('\n');
    const filePathOut = path.join(__dirname, '/../files/output.txt');
    let out;
    try {
      out = fs.createWriteStream(filePathOut, {
        flags: 'w',
      });
    } catch (err) {
      console.error('===ERROR===', err.message);
      return process.exit();
    }
    for (inv of data) {
      try {
        inv = inv.substring(0, 10).replaceAll(/\D/g, '');
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
                  await pp
                    .locator(
                      'body > div.sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button'
                    )
                    .click();
                  await pp.waitForFunction(() => {
                    const modal = document.querySelector('.sweet-alert');
                    return !modal.classList.contains('visible') || modal.style.display === 'none';
                  });
                  return true;
                }
                const val = claro?.response?.facturaActual?.valor;
                if (val == 0) {
                  await pp.waitForFunction(() => {
                    const modal = document.querySelector('.sweet-alert');
                    return modal.classList.contains('visible');
                  });
                  await pp
                    .locator(
                      'body > div.sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button'
                    )
                    .click();
                  await pp.waitForFunction(() => {
                    const modal = document.querySelector('.sweet-alert');
                    return !modal.classList.contains('visible') || modal.style.display === 'none';
                  });
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
      } catch (err) {
        console.log(err);
      } finally {
        pp.removeAllListeners('response');
        await new Promise((resolve, reject) => setTimeout(() => resolve(), 2500));
      }
    }
  });
};

module.exports = { invoicesIterator };

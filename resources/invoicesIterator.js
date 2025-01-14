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
      // return process.exit();
    }
    data = data.split('\n');
    const filePathOut = path.join(__dirname, '/../files/output.txt');
    let out;
    try {
      out = fs.createWriteStream(filePathOut, {
        flags: 'a',
      });
    } catch (err) {
      console.error('===ERROR===', err.message);
      throw new Error('OUTPUT_NF');
    }
    for (inv of data) {
      inv = inv.substring(0, 10).replace(/\D/g, '');
      try {
        await pp.locator('.p7');
        await pp.evaluate(() => (document.querySelector('.p7').value = ''));
        await pp.type('.p7', inv);
        await pp.click('.bgbluelight');
        let notFound = false;
        await Promise.all([
          pp.waitForResponse(
            async (res) => {
              if (res.url().includes('Proxy/getsetwspost.php') && res.status() === 200) {
                const claro = await res.json();
                if (claro.error === 1 && claro.response.includes('documentos para la cuenta')) {
                  notFound = true;
                  return true;
                }
                const val = claro?.response?.facturaActual?.valor;
                if (val) {
                  out.write(`${inv} ${val || '0000'}\n`);
                  return true;
                }
              }
              return false;
            },
            { timeout: 60000 }
          ),
          pp.click('.bgbluelight'),
        ]);
        let time = 3500;
        if (notFound) {
          out.write(`${inv} 0\n`);
          await pp
            .locator(
              'body > div.sweet-alert.showSweetAlert.visible > div.sa-button-container > div > button'
            )
            .click();
          time = 2000;
        }
        await new Promise((resolve, reject) => setTimeout(() => resolve(), time));
      } catch (err) {
        console.log(err);
        out.write(`${inv} 0000\n`);
      }
    }
  });
};

module.exports = { invoicesIterator };

const path = require('path');
const fs = require('fs');

/**
 * @param {import('puppeteer').Page} pp
 */
const invoicesIterator = async (pp) => {
  console.log(1);
  const filePath = path.join(__dirname, '/../files/input.txt');
  fs.readFile(filePath, 'utf-8', async (err, data) => {
    console.log(2);
    if (err) {
      console.log('===ERROR===', err.message);
      // return process.exit();
    }
    data = data.split('\n');
    console.log(3, data);
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
    console.log(4);
    for (inv of data) {
      inv = inv.replace(/\D/g, '');
      console.log(inv, ' ----inv----');
      try {
        await pp.locator('.p7');
        await pp.evaluate(() => (document.querySelector('.p7').value = ''));
        await pp.type('.p7', inv);
        await pp.click('.bgbluelight');
        await Promise.all([
          pp.waitForResponse(
            async (res) => {
              if (res.url().includes('Proxy/getsetwspost.php') && res.status() === 200) {
                const res = await res.json();
                console.log(
                  res?.response,
                  res.response.facturaActual,
                  res.response.facturaActual.valor
                );
                out.write(`${inv} ${res?.response?.facturaActual?.valor || '0000'}\n`);
                return true;
              }
              return false;
            },
            { timeout: 15000 }
          ),
          pp.click('.bgbluelight'),
        ]);
        await new Promise((resolve, reject) => setTimeout(() => resolve(), 2500));
      } catch (err) {
        console.log(err);
        out.write(`${inv} 0000\n`);
      }
    }
  });
};

module.exports = { invoicesIterator };

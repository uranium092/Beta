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
      try {
        await pp.locator('.p7');
        await pp.type('.p7', inv);
        await pp.click('.bgbluelight');
        await Promise.all([
          pp.waitForResponse(
            async (res) => {
              if (res.url().includes('Proxy/getsetwspost.php') && res.status() === 200) {
                const response = await res.json();
                console.log(response);
                out.write(`${inv} ${facturaActual.valor}\n`);
                return true;
              }
              return false;
            },
            { timeout: 15000 }
          ),
          pp.click('.bgbluelight'),
        ]);
      } catch (err) {
        out.write(`${inv} 0000\n`);
      }
    }
  });
};

module.exports = { invoicesIterator };

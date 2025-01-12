const puppeteer = require('puppeteer');
const { initialize } = require('./resources/scraping');

require('dotenv').config();

initialize(puppeteer).catch((err) => {
  console.log(`**** BOT FAILED ---> ${err.message}`);
});

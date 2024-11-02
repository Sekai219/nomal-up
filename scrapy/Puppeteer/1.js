// scrape.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://blog.powersee.top/');
  const content = await page.content(); // 获取网页内容

  console.log(content);

  await browser.close();
})();

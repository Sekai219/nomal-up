const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // 加入这行
  });
  
  const page = await browser.newPage();
  
  await page.goto('https://blog.powersee.top/');
  const content = await page.content(); // 获取网页内容

  console.log(content);

  await browser.close();
})();

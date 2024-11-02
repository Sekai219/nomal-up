const puppeteer = require('puppeteer');
const crawlab = require('crawlab-sdk'); // 如果需要将数据存入 Crawlab

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--disable-dev-shm-usage' // 减少共享内存使用
    ]
  });

  const page = await browser.newPage();

  // 设置 User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // 设置 Cookies（如有需要，可以添加具体的 cookie 信息）
  // const cookies = [{ name: 'cookie_name', value: 'cookie_value', domain: 'example.com' }];
  // await page.setCookie(...cookies);

  try {
    // 导航到聊天网页
    await page.goto('https://cc.luping.love/', { timeout: 12000 }); // 使用提供的 URL
  } catch (error) {
    console.error('Navigation timeout error:', error);
    await browser.close();
    return;
  }

  // 等待页面加载完成
  await page.waitForSelector('#message');
  await page.waitForSelector('#sendBtn');

  // 循环发送 "1"
  try {
    while (true) {
      // 输入 "1"
      await page.type('#message', '1');

      // 点击发送按钮
      await page.click('#sendBtn');

      // 等待一段时间后再发送下一个消息，避免发送过快
      await page.waitForTimeout(1000); // 每秒发送一次，可以根据需要调整
    }
  } catch (error) {
    console.error('Error during message sending:', error);
  } finally {
    await browser.close();
  }
})();
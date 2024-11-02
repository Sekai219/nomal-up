const puppeteer = require('puppeteer');
const crawlab = require('crawlab-sdk'); // 如果需要将数据存入 Crawlab

// 随机选择一个中文词组
function getRandomPhrase() {
  const phrases = [
    '你好',
    '谢谢',
    '对不起',
    '再见',
    '早上好',
    '晚安',
    '请问',
    '没关系',
    '好的',
    '请'
  ];
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
}

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

  // 循环发送随机中文词组
  try {
    while (true) {
      // 生成随机中文词组
      const phrase = getRandomPhrase();

      // 输入词组
      await page.type('#message', phrase);

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
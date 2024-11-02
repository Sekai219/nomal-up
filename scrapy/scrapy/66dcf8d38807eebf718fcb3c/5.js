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

  await page.goto('https://www.163.com/'); // 替换为你要抓取的初始URL

  // 模拟滚动以加载更多内容（如果页面动态加载内容）
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(5000); // 等待5秒以确保内容加载完成

  // 获取所有 <a> 标签中的链接
  const links = await page.$$eval('a', as => as.map(a => a.href).filter(href => href.startsWith('http') || href.startsWith('/')));

  // 处理每个链接，访问并获取标题和正文内容
  for (const link of links) {
    try {
      const newPage = await browser.newPage();
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      await newPage.goto(link);
      
      // 等待页面加载完成
      await newPage.waitForTimeout(5000); // 等待5秒以确保页面内容加载完成

      // 如果页面内容通过特定选择器动态加载，使用 waitForSelector 等待该选择器出现
      await newPage.waitForSelector('article, div.content, div.main, p', { timeout: 60000 }); // 等待60秒

      // 获取页面标题
      const pageTitle = await newPage.title();
      
      // 提取正文内容
      const content = await newPage.evaluate(() => {
        const elements = document.querySelectorAll('article, div.content, div.main, p');
        let textContent = '';
        
        elements.forEach(element => {
          const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && !element.closest('a'));
          textContent += textNodes.map(node => node.textContent.trim()).join('\n');
        });

        // 去除多余空行
        return textContent.replace(/\n{3,}/g, '\n\n').trim();
      });

      // 如果正文不为空，输出或保存
      if (content) {
        const result = {
          url: pageTitle ? `${link} (${pageTitle})` : link,
          main_content: content
        };
        
        console.log(result);
        
        // 保存到 Crawlab（可选）
        await crawlab.saveItem(result);
      }

      await newPage.close();
    } catch (err) {
      console.error(`Error processing ${link}:`, err);
    }
  }

  await browser.close();
})();
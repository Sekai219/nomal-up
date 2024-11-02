const puppeteer = require('puppeteer');
const crawlab = require('crawlab-sdk'); // 如果需要将数据存入 Crawlab

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreHTTPSErrors: true // 忽略 HTTPS 证书错误
  });
  
  const page = await browser.newPage();
  
  await page.goto('https://www.51cto.com/'); // 替换为你要抓取的初始URL
  
  // 获取所有 <a> 标签中的链接
  const links = await page.$$eval('a', as => as.map(a => a.href).filter(href => href.startsWith('http') || href.startsWith('/')));

  // 处理每个链接，访问并获取标题和正文内容
  for (const link of links) {
    try {
      const newPage = await browser.newPage();
      await newPage.goto(link);
      
      // 获取页面标题
      const pageTitle = await newPage.title();
      
      // 提取正文内容，过滤掉 <a> 标签中的文本
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
  await crawlab.close(); // 如果使用 Crawlab
})();
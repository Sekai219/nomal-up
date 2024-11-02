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
  // const cookies = [{ name: 'cookie_name', value: 'cookie_value', domain: 'duangks.com' }];
  // await page.setCookie(...cookies);

  try {
    // *** 修改部分开始 ***
    await page.goto('https://www.163.com/', { timeout: 12000 }); // 设置超时为12秒
    // *** 修改部分结束 ***
  } catch (error) {
    console.error('Navigation timeout error:', error);
  }

  // 等待页面加载完成
  await page.waitForTimeout(5000); // 等待5秒

  // 获取所有 <a> 标签中的链接
  const links = await page.$$eval('a', as => as.map(a => a.href).filter(href => href.startsWith('http') || href.startsWith('/')));

  // 处理每个链接，访问并获取标题和正文内容
  for (const link of links) {
    try {
      const newPage = await browser.newPage();
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // *** 修改部分开始 ***
      try {
        await newPage.goto(link, { timeout: 12000 }); // 设置超时为12秒
      } catch (error) {
        console.error(`Navigation timeout error on link ${link}:`, error);
        continue; // 如果导航超时，跳过当前链接，继续处理下一个
      }
      // *** 修改部分结束 ***

      // 等待页面加载完成
      await newPage.waitForTimeout(5000); // 等待5秒

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
})();
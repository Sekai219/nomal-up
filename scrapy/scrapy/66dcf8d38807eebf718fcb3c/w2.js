const puppeteer = require('puppeteer');
const crawlab = require('crawlab-sdk'); // 如果需要将数据存入 Crawlab

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // 拦截请求，阻止加载图片、样式表和字体等不必要的资源
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });

  try {
    await page.goto('https://www.163.com/', { timeout: 12000 });
    await page.waitForSelector('a', { timeout: 5000 }); // 等待 <a> 标签加载完成

    const links = await page.$$eval('a', as => as.map(a => a.href).filter(href => href.startsWith('http') || href.startsWith('/')));

    // 设置并发数
    const maxConcurrency = 5; // 根据你的 VPS 性能调整并发数
    const pagePromises = [];

    for (const link of links) {
      if (pagePromises.length >= maxConcurrency) {
        await Promise.race(pagePromises); // 等待最先完成的任务
        pagePromises = pagePromises.filter(p => !p.isFulfilled); // 只保留未完成的任务
      }

      const pagePromise = (async () => {
        const newPage = await browser.newPage();
        await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        try {
          await newPage.goto(link, { timeout: 12000 });
          await newPage.waitForTimeout(3000); // 减少等待时间

          const pageTitle = await newPage.title();
          
          const content = await newPage.evaluate(() => {
            const elements = document.querySelectorAll('article, div.content, div.main, p');
            let textContent = '';

            elements.forEach(element => {
              const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && !element.closest('a'));
              textContent += textNodes.map(node => node.textContent.trim()).join('\n');
            });

            return textContent.replace(/\n{3,}/g, '\n\n').trim();
          });

          if (content) {
            const result = {
              url: pageTitle ? `${link} (${pageTitle})` : link,
              main_content: content
            };
            
            console.log(result);

            await crawlab.saveItem(result);
          }

          await newPage.close();
        } catch (err) {
          console.error(`Error processing ${link}:`, err);
        }
      })();

      pagePromises.push(pagePromise);
    }

    await Promise.all(pagePromises); // 等待所有任务完成
  } catch (error) {
    console.error('Navigation error:', error);
  }

  await browser.close();
})();
const puppeteer = require('puppeteer')
const fs = require('fs')

// 修改开始 - 增加 Puppeteer 启动参数
async function scrape (url) {
   const browser = await puppeteer.launch({
      headless: true, // 如果需要查看浏览器界面可以改为 false
      args: [
         '--no-sandbox', // 解决 root 权限运行问题
         '--disable-setuid-sandbox', // 进一步禁用沙盒模式
         '--ignore-certificate-errors', // 忽略证书错误
         '--disable-dev-shm-usage' // 解决共享内存不足问题，适用于 Docker/VPS
      ]
   });
   const page = await browser.newPage();
// 修改结束

   await page.goto(url)

   var movies = await page.evaluate(() => {
      var titlesList = document.querySelectorAll('h2');
      var movieArr = [];
      for (var i = 0; i < titlesList.length; i++) {
         movieArr[i] = {
         title: titlesList[i].innerText.trim(),
         summary: titlesList[i].nextElementSibling.innerText.trim(),
         };
      }
      return movieArr;
   })

   fs.writeFile("./netflixscrape.json", JSON.stringify(movies, null, 3),  (err) => {
      if (err) {
         console.error(err);
         return;
      };
      console.log("Great Success");
   });
   browser.close()
}

scrape("https://www.digitaltrends.com/movies/best-movies-on-netflix/")
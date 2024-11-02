import scrapy
import re

class PowerseeSpider(scrapy.Spider):
    name = "CNmost"
    start_urls = ['https://duangks.com/']

    def parse(self, response):
        # 设置页面的编码为 utf-8，避免乱码
        response = response.replace(encoding='utf-8')

        # 提取页面中所有可点击的链接（<a>标签）
        links = response.xpath('//a/@href').getall()
        
        # 过滤掉空链接和非完整链接
        for link in links:
            if link.startswith('http') or link.startswith('/'):
                yield response.follow(link, self.parse_link)

    def parse_link(self, response):
        # 设置页面的编码为 utf-8，避免乱码
        response = response.replace(encoding='utf-8')

        # 提取当前页面的标题
        page_title = response.xpath('//title/text()').get()

        # 排除 <script>、<style>、<noscript>、<meta>、<link> 和 <a> 标签中的文本
        all_text = response.xpath('//body//*[not(self::script) and not(self::style) and not(self::link) and not(self::meta) and not(self::noscript) and not(self::a) and not(ancestor::style)]//text()').getall()

        # 拼接抓取的文本内容，保留原页面中的换行和空格
        formatted_text = "\n".join([text.strip() for text in all_text if text.strip()])

        # 删除连续超过三行的空行，保留最多两行空行
        formatted_text = re.sub(r'\n{3,}', '\n\n', formatted_text)

        # 通过正则表达式提取仅包含中文的句子，并且过滤掉长度小于100字的内容
        chinese_texts = [text for text in formatted_text.split('\n') 
                         if re.search(r'[\u4e00-\u9fff]', text) and len(text.strip()) > 12]
        
        # 输出每个链接页面抓取到的大于100字的中文文本，并将每个页面的文本独立处理
        if chinese_texts:
            yield {
                # 在 URL 后面加上括号，括号内为子页面的标题
                'url': f"{response.url} ({page_title})" if page_title else response.url,
                'chinese_texts': "\n".join(chinese_texts)  # 保留换行符
            }
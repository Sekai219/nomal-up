import scrapy
import re

class PowerseeSpider(scrapy.Spider):
    name = "cntxt"
    start_urls = ['https://blog.powersee.top/']

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

        # 提取正文内容，选择常见的正文容器标签，并排除 <a> 标签中的文本
        content_blocks = response.xpath(
            '//article//text()[not(ancestor::a)] | '
            '//div[contains(@class, "content") or contains(@class, "main")]//text()[not(ancestor::a)] | '
            '//p//text()[not(ancestor::a)]'
        ).getall()

        # 去除空白和空行，并保持原始的格式和换行
        formatted_text = "\n".join([text.strip() for text in content_blocks if text.strip()])

        # 删除连续超过三行的空行，保留最多两行空行
        formatted_text = re.sub(r'\n{3,}', '\n\n', formatted_text)

        # 如果提取到的正文不为空，则输出正文部分
        if formatted_text:
            yield {
                # 在 URL 后面加上括号，括号内为子页面的标题
                'url': f"{response.url} ({page_title})" if page_title else response.url,
                'main_content': formatted_text  # 完整正文部分
            }
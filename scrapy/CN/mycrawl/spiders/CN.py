import scrapy
import re

class KeylolSpider(scrapy.Spider):
    name = "CN"
    start_urls = ['https://cc.luping.love/']

    def parse(self, response):
        # 提取页面上的所有文本内容
        all_text = response.xpath('//text()').getall()
        
        # 通过正则表达式提取仅包含中文的句子
        chinese_texts = [text.strip() for text in all_text if re.fullmatch(r'[\u4e00-\u9fff，。！？、；：‘’“”（）《》【】]+', text.strip())]
        
        # 输出抓取到的中文文本，并分行保存
        for chinese_text in chinese_texts:
            yield {
                'chinese_text': chinese_text
            }
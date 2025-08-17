import { MarkdownText } from "@/components/ui/markdown-text";
import { getContentString } from "@/features/chat/utils/content-string";
import { cn } from "@/lib/utils";
import { Message } from "@langchain/langgraph-sdk";

interface ResearchReportBlockProps {
  message?: Message;
  className?: string;
}

const defaultContent = `
为您推荐一份2025年杭州3日游攻略，助您尽情体验这座"人间天堂"的魅力：

**最佳旅行时间：**
建议在春季（3-5月）或秋季（9-11月）前往杭州，此时气候宜人，春有桃花樱花，秋有桂花飘香，是体验杭州之美的最佳时节。夏季（6-8月）可赏荷花、夜游西湖，八月是观钱塘江大潮的最佳时期。

**住宿推荐：**
为方便游览和欣赏美景，建议选择西湖附近的住宿区域。西湖东区交通便利，靠近杭州站，是推荐的住宿位置。西湖北区（北山街一带）则靠近断桥、孤山景区和灵隐寺。

**支付方式：**
在杭州，现金已不太流行，建议提前下载并完成支付宝或微信支付的实名认证。也可办理可在大陆使用的信用卡（如银联卡），并准备少量现金备用（约1000-2000人民币）。

**交通提示：**
不建议自驾前往西湖，因为停车位稀缺。游览西湖可选择步行、骑行或乘坐游船。京杭大运河可乘坐水上巴士游览，票价3元/人，最晚一班至18:30。

---

**3日游行程推荐：**

**第一天：西湖风光与历史街区**
*   **上午：西湖风景名胜区**
    *   作为杭州的核心景点，西湖以其秀美的湖光山色和人文底蕴著称 [maplefeather](https://tinyurl.com/4f2jckss)。您可以漫步苏堤、白堤，感受湖光山色 [maplefeather](https://tinyurl.com/4f2jckss)。
    *   游览断桥残雪，这里是《白蛇传》中白娘子与许仙相遇的传说之地。
    *   可选择乘坐手摇船或水上大船游览西湖，近距离欣赏"一元钱"背后的三潭印月实景 [klook](https://tinyurl.com/2x9wswz8) [163](https://tinyurl.com/yjmj29p3)。
    *   推荐景点：平湖秋月、曲苑风荷、花港观鱼。
*   **下午：雷峰塔与吴山天风**
    *   登上雷峰塔，可欣赏到西湖全景，体验极佳 [163](https://tinyurl.com/yjmj29p3)。
    *   前往吴山天风，登上城隍阁，西湖和杭州城景色尽收眼底，视野绝佳。
*   **傍晚/晚上：南宋御街与清河坊街**
    *   漫步南宋御街，感受古朴的商业街氛围，这里保留了万隆火腿庄、羊汤饭店等本地老店 [163](https://tinyurl.com/yjmj29p3)。
    *   游览清河坊街，这是杭州人气商业区之一，汇集了各种本地小吃、老字号、茶楼和手工艺品。

**第二天：禅意古刹与湿地风情**
*   **上午：灵隐寺与飞来峰**
    *   前往灵隐寺祈福，这里香火旺盛，是杭州的标志性建筑 [maplefeather](https://tinyurl.com/4f2jckss)。
    *   注意：进入灵隐寺需先购买飞来峰景区的门票（门票30元） [maplefeather](https://tinyurl.com/4f2jckss)。
    *   可顺道参观附近的法喜寺（上天竺法喜讲寺），据说求姻缘很灵验，寺庙环境清幽。
*   **下午：西溪国家湿地公园**
    *   西溪湿地是中国唯一一个位于城市中的国家湿地公园，素有"城市绿肺"之美誉 [maplefeather](https://tinyurl.com/4f2jckss)。
    *   您可以乘船游览迷人的湿地风光，观赏野生动植物，享受大自然的宁静 [163](https://tinyurl.com/mwtemwzz)。
*   **傍晚：龙井村或中国茶叶博物馆**
    *   若时间允许，可前往梅家坞茶村或龙井村，体验杭州的茶文化，品尝正宗龙井茶 [greentourasia](https://tinyurl.com/49yefj7a) [163](https://tinyurl.com/mwtemwzz) [cncn](https://tinyurl.com/ktez4jn7) [163](https://tinyurl.com/yjmj29p3)。
    *   或参观中国茶叶博物馆，了解杭州的茶文化和茶艺表演。

**第三天：运河文化与宋城演艺**
*   **上午：京杭大运河**
    *   乘坐京杭运河水上巴士，一览江南水乡的温柔 [163](https://tinyurl.com/mwtemwzz)。
    *   游览拱宸桥、桥西直街、小河直街和大兜路，感受运河两岸的历史风貌。
*   **下午：杭州宋城**
    *   前往杭州宋城，这是一个大型主题公园，以"宋城千古情"演出闻名。
    *   "宋城千古情"演出通过金戈铁马、美丽西子湖等故事情节，展现了杭州的历史文化。
*   **傍晚：返程** [greentourasia](https://tinyurl.com/49yefj7a)

---

**美食打卡：**
*   **杭帮菜：** 四灶儿。
*   **早餐：** 游埠豆浆（咸豆浆很受欢迎） [greentourasia](https://tinyurl.com/49yefj7a) [cncn](https://tinyurl.com/ktez4jn7) [163](https://tinyurl.com/yjmj29p3)。
*   **糕点伴手礼：** 江南春、知味观。
*   **奶茶：** 晓麟家奶茶（桂花米酿）、阿姨奶茶。
*   **特色小吃：** 葱包烩（皮市巷葱包烩）、油墩儿、桂花糯米藕、酱鸭、小笼包、片儿川（方老大面特色腰花片儿川和茄汁拌川）、新丰小吃 [163](https://tinyurl.com/mwtemwzz) [trip](https://tinyurl.com/3vs3hw29) [163](https://tinyurl.com/yjmj29p3)。
*   **其他：** 饼万兴、蒋师傅炸鱼、周萍粽子、甜酒酿、李记酥鱼&雪景酥鱼蜜藕、彩荷光头卤鸭、蔺轩发糕。

---

**注意事项：**
*   出行前务必查好天气，并携带雨伞，杭州天气多变 [163](https://tinyurl.com/mwtemwzz)。
*   在消费前务必确认好价格，避免不必要的麻烦。
*   西湖不产珍珠，请勿理睬兜售茶叶或珍珠的小贩。
*   如果想省心，可以考虑选择当地的旅行团，他们通常会安排好食宿行和门票，并有导游避开购物陷阱 [greentourasia](https://tinyurl.com/49yefj7a) [163](https://tinyurl.com/mwtemwzz) [ctrip](https://tinyurl.com/z42b8ptp) [trip](https://tinyurl.com/3vs3hw29)。
`;

export function ResearchReportBlock(props: ResearchReportBlockProps) {
  const { message, className } = props;
  const content = message?.content ?? [];
  const contentString = getContentString(content);

  return (
    <div className={cn("w-full pt-4 pb-8", className)}>
      <MarkdownText>{contentString}</MarkdownText>
    </div>
  )
}

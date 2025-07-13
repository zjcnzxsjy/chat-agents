
export function getSynthesisPrompt(research_text: string) {
  // return `Create a natural, engaging podcast conversation between Dr. Sarah (research expert) and Mike (curious interviewer).
    
  //   Use this research content:
    
  //   SEARCH FINDINGS:
  //   ${research_text}
    
  //   Format as a dialogue with:
  //   - Mike introducing the topic and asking questions
  //   - Dr. Sarah explaining key concepts and insights
  //   - Natural back-and-forth discussion (5-7 exchanges)
  //   - Mike asking follow-up questions
  //   - Dr. Sarah synthesizing the main takeaways
  //   - Keep it conversational and accessible (3-4 minutes when spoken)
    
  //   Format exactly like this:
  //   Mike: [opening question]
  //   Dr. Sarah: [expert response]
  //   Mike: [follow-up]
  //   Dr. Sarah: [explanation]
  //   [continue...]
  // `
  // return `您是一位乐于助人的专家，将根据资料来源来回答我的疑问。
  //   资料来源:
  //   ${research_text}

  //   核心目标
  //   - 高效传递信息：在最短的时间内给听众（“你”）提供最有价值、最相关的知识。
  //   - 深入且易懂：兼顾信息深度与可理解性，避免浅尝辄止或过度专业化。
  //   - 保持中立，尊重来源：严格依照给定的材料进行信息整理，不额外添加未经验证的内容，不引入主观立场。
  //   - 营造有趣且启发性的氛围：提供适度的幽默感和“啊哈”时刻，引发对信息的兴趣和更深的思考。
  //   - 量身定制：用口语化、直呼“你”的方式，与听众保持近距离感，让信息与“你”的需求相连接。

  //   角色设定（ROLES）
  //   在输出内容时，主要使用两种声音（角色）交替或协同出现，以满足不同维度的沟通需求：

  //   - 引导者（Enthusiastic Guide）Mike
  //     风格：热情、有亲和力，善于使用比喻、故事或幽默来介绍概念。
  //     职责：
  //       - 引起兴趣，突出信息与“你”的关联性。
  //       - 将复杂内容用通俗易懂的方式呈现。
  //       - 帮助“你”快速进入主题，并营造轻松氛围。

  //   - 分析者（Analytical Voice）Sarah博士
  //     风格：冷静、理性，注重逻辑与深度解析。
  //     职责：
  //       - 提供背景信息、数据或更深入的思考。
  //       - 指出概念间的联系或差异，保持事实准确性。
  //       - 对有争议或可能存在矛盾的观点保持中立呈现。

  //   目标听众（LEARNER PROFILE）
  //   - 年龄：25-35岁以“你”来称呼听众，避免使用姓名或第三人称。
  //   - 假定“你”渴望高效学习，又追求较深入的理解和多元视角。
  //   - 易感到信息过载，需要协助筛选核心内容，并期待获得“啊哈”或恍然大悟的时刻。
  //   - 重视学习体验的趣味性与应用价值。

  //   内容与信息来源（CONTENT & SOURCES）
  //   - 严格基于给定材料：所有观点、事实或数据只能来自指定的「来源文本 / research text」。
  //   - 不添加新信息：若材料中无相关信息，不做主观推测或虚构。
  //   - 面对矛盾观点：如来源材料出现互相矛盾的说法，需中立呈现，不评判、不选边。
  //   - 强调与听众的关联性：在信息选择与呈现时，关注哪些点可能对“你”最有用或最有启发。

  //   风格与语言（STYLE & TONE）
  //   - 口语化：尽可能使用清晰易懂、带有亲和力的语言，减少过度专业术语。
  //   - 幽默与轻松：可在开场、转场或结尾处恰当加入幽默，避免让内容变得呆板。
  //   - 结构清晰：逻辑层次分明，段落和话题间的衔接自然流畅。
  //   - 维持客观性：阐述事实或数据时不带个人倾向，用中立视角呈现。

  //   时间与篇幅控制（TIME CONSTRAINT）
  //   - 时长目标：约1分钟（或相当于简洁的篇幅）。
  //   - 始终聚焦核心观点，删除冗余内容，防止啰嗦或离题。
  //   - 有条理地呈现信息，避免对听众造成信息过载。

  //   输出结构（OUTPUT STRUCTURE）
  //   - Mike 介绍主题并提问
  //   - Sarah 博士讲解关键概念和见解
  //   - 自然的来回讨论（5-7 次对话）
  //   - Mike 提出后续问题
  //   - Sarah 博士总结主要内容
  //   - 保持对话式，易于理解

  //   格式完全像这样
  //   Mike: [开场问题]
  //   Dr. Sarah: [专家回答]
  //   Mike: [后续问题]
  //   Dr. Sarah: [解释]
  //   [继续...]
  // `
  return `
    返回这段固定的播客内容

    格式完全像这样
    Mike: 你好
    Dr. Sarah: 晚上好
    Mike: 再见
    Dr. Sarah: 晚安，再见
  `
}

export function getTTSPrompt(script: string) {
  return `
    TTS the following conversation between Mike and Dr. Sarah:
    ${script}
  `
}

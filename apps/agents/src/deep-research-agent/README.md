本项目复刻了gemini-fullstack-langgraph-quickstart，langgraph部分用JS/TS重写，完全实现了deep research功能，通过动态生成搜索词、使用 Google 搜索进行网页查询、反思搜索结果以识别知识缺口，并不断优化搜索，直到能够提供包含引文的、支持充分的答案，从而对用户查询进行全面的研究。

## 前置条件
- 科学上网
- Node.js/pnpm

## 功能
- 支持选择不同模型生成动态搜索查询
- 通过 Google 搜索 API 集成网络搜索
- 支持选择不同推理模型，通过反思推理来发现知识差距并改进搜索
- 根据收集到的来源的引文生成答案

## 整体架构
<img width="349" alt="Image" src="https://github.com/user-attachments/assets/0921652e-b5bb-49a1-bf8a-b69c48640471" />

- 动态生成搜索词：可以根据用户的输入动态生成初始搜索查询，并利用 Gemini/deepseek chat 模型进行此项操作
- 网络研究：对于每个查询，它使用 Gemini 模型结合 Google Search API 来查找相关的网页
- 反思与知识差距分析：代理会分析搜索结果，判断信息是否足够，或是否存在知识空白。此反思过程可以选择 Gemini/deepseek r1 模型完成
- 迭代优化：如果发现知识空白或信息不足，代理会生成后续查询，并重复网络研究和反思的步骤，直至达到预设的最大循环次数
- 最终确定答案：一旦研究被认为充分，代理就会使用 Gemini/deepseek r1 模型将收集到的信息综合成一个连贯的答案，包括来自网络来源(转换成断链)的引用。

## FAQ:
- 即使使用了VPN，本地启动的Node项目fetch gemini的api还是会报错，需要设置本地系统代理，方法参考https://github.com/google-gemini/deprecated-generative-ai-js/issues/29

- 本项目采用tinyurl short引用资源，tinyurl不支持批量short处理，自己实现了并发池请求。


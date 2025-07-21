# Chat Agent
问答服务，支持多模型选择，可以配置模型对应的参数，支持调用MCP Tools和本地知识库RAG。使用reActAgent，RAG作为tools集成到agent内

## General Settings
- model: deepseek、gemini、mistral
- temperature: 控制随机性(0 = deterministic, 2 = creative)
- maxTokes: 生成的最大令牌数量
- system prompt: agent提示词，可以在前端使用提示词魔法棒帮助你生成更专业的提示词

## MCP
前端配置MCP Server，支持stdio和sse两种类型接入

## RAG
详细可以查看[langserver](../../../langserver/README.md)


## audio
生成文本后可以使用语言播报
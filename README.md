# Agent App

## 概要
本项目基于langchain的Open Agent Plantform实现自定义agent开发，使用Ts/Js开发agent;目前实现了reAct agent以及RAG agent。

## 快速开始
### 启动Agent
首先需要申请要使用的大模型的api key，本项目也支持ollama的本地大模型，本地模型的弊端是问题响应的速度慢。ollama模型的部署可以网上搜索。复制根目录的.env.example，重命名为.env，填入你申请过的大模型api key。
```
TAVILY_API_KEY=""
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GEMINI_API_KEY=""
MISTRAL_API_KEY=""
SUPABASE_URL=""
SUPABASE_API_KEY=""
COHERE_API_KEY=""
DEEPSEEK_API_KEY=""
```
使用指令pnpm install安装依赖，然后通过pnpm dev启动，启动成功后会自动跳出langsmith的地址

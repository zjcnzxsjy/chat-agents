# Agent App

本项目基于langchain的Open Agent Plantform实现自定义agent开发，使用Ts/Js开发agent;
<video src="https://github.com/user-attachments/assets/f616011f-6fa0-4dc9-ab31-0ba9c574e6d8" controls="controls"></video>

## 概要
本项目涵盖web、agent、backend server，让开发同学更加容易创建和验证agent效果。

## 功能特性
- [X] Chat: 与LLM进行基础对话，支持设置不同的Model及参数配置
- [X] RAG集成：可以搭建本地知识库，提供后端服务用于检索问题的上下文，帮助LLM生成更专业的回答
- [X] MCP Tools: 支持本地配置和管理MCP servers，在chat中可以使用MCP Tools增强LLM使用工具的能力
- [X] Audio Agent: 支持与LLM语音对话，可以进行LLM的音色、语速、音量等设置
- [X] Deep Research Agent: 深度研究
- [] Agents Manage: 支持不同Agent的交互页面
- [] Promptpilot: 优化输入提示词能力

## 快速开始
可以在根目录下执行pnpm dev,可以自动启动agent、server和web项目
### 启动Agent
首先需要申请要使用的大模型的api key及其他工具依赖的key，本项目也支持ollama的本地大模型，本地模型的弊端是问题响应的速度慢。ollama模型的部署可以网上搜索。复制根目录的.env.example，重命名为.env，填入你申请过的大模型api key。
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
<img width="1787" alt="Image" src="https://github.com/user-attachments/assets/716c09b1-71d5-4928-9089-52b07bcad695" />

### 启动web
web项目加入了权限校验，可以参考[Supabase](https://docs.oap.langchain.com/setup/authentication#setting-up-supabase)，本项目里做了些简化，身份数据存储在supabase，所以需要配置相关的key
```
# Supabase Authentication
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
```
由于需要关联对应的agent服务，相关配置是NEXT_PUBLIC_DEPLOYMENTS，deploymentUrl必须匹配对应的地址，其他参数可以随便设置，可参考[Setting Environment Variables](https://docs.oap.langchain.com/setup/agents#setting-environment-variables)
```
NEXT_PUBLIC_DEPLOYMENTS=[
  {
    "id":"bf63dc89-1de7-4a65-8336-af9ecda479d6",
    "deploymentUrl":"http://localhost:2024", // 本地agent服务地址，端口默认是2024
    "tenantId":"42d732b3-1324-4226-9fe9-513044dceb58",
    "name":"Local deployment",
    "isDefault":true,
    "defaultGraphId":"agent"
  }
]
```
同样使用指令pnpm install安装依赖，pnpm dev启动web服务，默认地址是<https://localhost:3000>，注册成功后使用邮箱密码登录（google邮箱登录暂时不可用），登录成功后可以选择设置的agent服务进行对话了。

### 启动RagConnect
RagConnect是一个面向 RAG 应用的开源托管检索服务，基于 LangChain 的 RAG 集成（向量存储、文档加载器、索引 API 等）构建，允许您快速启动 API 服务器，用于管理任何 RAG 应用的集合和文档。
安装完依赖后执行pnpm start:dev即可启用服务


# Agent App

## 概要
本项目基于langchain的Open Agent Plantform实现自定义agent开发，使用Ts/Js开发agent;目前实现了reAct agent以及RAG agent。
<video src="https://github.com/user-attachments/assets/f616011f-6fa0-4dc9-ab31-0ba9c574e6d8" controls="controls"></video>

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
<img width="1787" alt="Image" src="https://github.com/user-attachments/assets/716c09b1-71d5-4928-9089-52b07bcad695" />

### 启动web
web项目加入了权限校验，可以参考[Supabase](https://docs.oap.langchain.com/setup/authentication#setting-up-supabase)，本项目里做了些简化，身份数据存储在supabase，所以需要配置相关的key
```
# Supabase Authentication
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
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
同样使用指令pnpm install安装依赖，pnpm dev启动web服务，默认地址是https://localhost:3000，注册成功后使用邮箱密码登录（google邮箱登录暂时不可用），登录成功后可以选择设置的agent服务进行对话了。

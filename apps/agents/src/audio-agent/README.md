使用Langgraph和MiniMax构建的语音对话agent

## 前置条件
- ASSEMBLYAI_API_KEY: 将语言输入转为文本
- MINIMAX_API_KEY：将文本转换为语音

## 功能
- 可以设置音色、音量等配置，个性化配置你的语音聊天助手
- 使用 Tavily 的 Web 搜索功能

## 整体架构
<img width="302" alt="Image" src="https://github.com/user-attachments/assets/93ef2b4e-eae1-459b-804e-6a95784b6685" />

- speechToText：输入语音转文本，
- reactAgent：使用网络搜索工具查询信息
- textToSpeech：将回答生成的文本转成语音输出

## FAQ:
- 试验过MiniMax和ElevenLabs，在中文场景下MiniMax的音色比较好



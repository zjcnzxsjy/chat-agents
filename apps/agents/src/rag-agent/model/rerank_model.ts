import axios from "axios";

// 自定义 Ollama Rerank Runnable
export const ollamaRerank = async (input: { query: string; documents: string[] }) => {
  const { query, documents } = input;

  const prompt = `RERANK
    query: ${query}
    docs:
    ${documents.join('\n')}
    `;

  const response = await axios.post("http://127.0.0.1:11434/api/generate", {
    model: "xitao/bge-reranker-v2-m3:latest",
    prompt
  });
  console.log('response', response);
  // 假设返回内容为每个文档的分数或排序（需根据实际返回格式解析）
  // 这里假设返回格式为：每行一个分数，顺序与输入文档一致
  const lines = response.data.response.trim().split('\n');
  const scores = lines.map(Number);

  // 按分数降序排序
  const reranked = documents
    .map((doc, idx) => ({ doc, score: scores[idx] }))
    .sort((a, b) => b.score - a.score);

  return reranked;
};
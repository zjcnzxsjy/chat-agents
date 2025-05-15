import { PromptTemplate } from "@langchain/core/prompts";

export const STANDALONE_PROMPT_TEMPLATE = PromptTemplate.fromTemplate(
  'Given a question, convert it to a standalone question. question: {question} standalone question:'
)

export const ANSWER_PROMPT_TEMPLATE = PromptTemplate.fromTemplate(
  `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Don't try to make up an answer. Use three sentences maximum and keep the answer concise.
  context: {context}
  question: {question}
  Answer:`
);

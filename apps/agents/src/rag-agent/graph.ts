import { Document } from "@langchain/core/documents";
import { RunnableConfig } from "@langchain/core/runnables";
import { Annotation, StateGraph, Messages, messagesStateReducer } from "@langchain/langgraph/web";
import { BaseMessage } from "@langchain/core/messages";

import { ANSWER_PROMPT_TEMPLATE, STANDALONE_PROMPT_TEMPLATE } from "./prompts.js";
import { ensureConfiguration, GraphConfiguration } from "./configuration.js";
import { loadChatModel } from "./chat_model.js";
import { initEmbeddings } from "./embeddings_model.js";
import SupabaseVectorStoreWrapper from "./vector-store/supabase.js";
import { combineDocuments } from "./utils.js";

const embeddings = initEmbeddings();
const vectorStore = new SupabaseVectorStoreWrapper(embeddings);
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], Messages>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
})

async function standaloneQuestionNode(state: typeof StateAnnotation.State, config: RunnableConfig,) {
  const prompt = STANDALONE_PROMPT_TEMPLATE
  const messages = await prompt.invoke({
    question: state.messages
  })
  const configuration = ensureConfiguration(config);
  const model = (await loadChatModel(configuration.model));
  const standaloneQuestion = await model.invoke(messages)
  return { question: standaloneQuestion.content }
}

async function retrieveNode(state: typeof StateAnnotation.State) {
  const retrievedDocs = await vectorStore?.instance?.similaritySearch(state.question)
  console.log('retrievedDocs', retrievedDocs)
  return { context: retrievedDocs }
}

// async function rerankNode(state: typeof StateAnnotation.State) {
//   const docsContent = state.context.map((doc) => doc.pageContent)
//   const rerankedDocuments = await ollamaRerank({ query: state.question, documents: docsContent });
//   console.log('rerankedDocuments', rerankedDocuments)
//   return { context: rerankedDocuments }
// }

async function generateNode(state: typeof StateAnnotation.State, config: RunnableConfig) {
  const docsContent = combineDocuments(state.context)
  const prompt = ANSWER_PROMPT_TEMPLATE
  const messages = await prompt.invoke({
    question: state.question,
    context: docsContent
  })
  const configuration = ensureConfiguration(config);
  const model = (await loadChatModel(configuration.model));
  const response = await model.invoke(messages)
  
  console.log('response', response)
  return { answer: response, messages: [response] }
}

const workflow = new StateGraph(StateAnnotation, GraphConfiguration)
.addNode('standaloneQuestion', standaloneQuestionNode)
.addNode('retrieve', retrieveNode)
// .addNode('rerank', rerankNode)
.addNode('generate', generateNode)
.addEdge("__start__", "standaloneQuestion")
.addEdge('standaloneQuestion', 'retrieve')
// .addEdge('retrieve', 'rerank')
.addEdge('retrieve', 'generate')
.addEdge("generate", "__end__")

export const graph = workflow.compile();

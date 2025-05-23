import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document } from "@langchain/core/documents";

const subUrl = process.env.SUPABASE_URL
const subApiKey = process.env.SUPABASE_API_KEY

class SupabaseVectorStoreWrapper {
  vectorStore: SupabaseVectorStore | undefined
  constructor(embeddings: EmbeddingsInterface) {
    try {
      if (!subUrl || !subApiKey) {
        throw new Error('SUPABASE_URL or SUPABASE_API_KEY not found')
      }
      const client = createClient(subUrl, subApiKey)
      
      this.vectorStore = new SupabaseVectorStore(
        embeddings,
        {
          client,
          tableName: 'documents',
          queryName: 'match_documents',
        }
      )
    } catch (e) {
      console.log(e)
    }
  }
  get instance() {
    return this.vectorStore
  }
  addDocuments(docs: Document[], ids: string[] | number[]) {
    return this.vectorStore!.addDocuments(docs, { ids });
  }
  delete(ids: string[] | number[]) {
    return this.vectorStore!.delete({ ids });
  }
}

export default SupabaseVectorStoreWrapper;

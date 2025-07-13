import { Document } from "@langchain/core/documents";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export async function addDocuments(documents: Document<Record<string, any>>[], vectorStore: SupabaseVectorStore, options?: Record<string, any>) {
  const texts = documents.map(({ pageContent }) => pageContent);
  const vectors = await vectorStore.embeddings.embedDocuments(texts);
  const rows = vectors.map((embedding, idx) => ({
    collection_id: options?.collectionId,
    content: documents[idx].pageContent,
    embedding,
    metadata: documents[idx].metadata,
  }));
  // upsert returns 500/502/504 (yes really any of them) if given too many rows/characters
  // ~2000 trips it, but my data is probably smaller than average pageContent and metadata
  let returnedIds: string[] = [];
  for (let i = 0; i < rows.length; i += vectorStore.upsertBatchSize) {
      const chunk = rows.slice(i, i + vectorStore.upsertBatchSize).map((row, j) => {
          if (options?.ids) {
              return { id: options.ids[i + j], ...row };
          }
          return row;
      });
      const res = await vectorStore.client.from(vectorStore.tableName).upsert(chunk).select();
      if (res.error) {
          throw new Error(`Error inserting: ${res.error.message} ${res.status} ${res.statusText}`);
      }
      if (res.data) {
          returnedIds = returnedIds.concat(res.data.map((row) => row.id));
      }
  }
  return returnedIds;
}


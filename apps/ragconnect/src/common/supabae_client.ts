import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import * as dotenv from 'dotenv';
import { initOllamaEmbeddings } from './embeddings';

dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!,
);

export function getVectorStore() {
  const embeddings = initOllamaEmbeddings();
  return new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: 'documents_embedding',
    queryName: 'match_documents_embedding',
  });
}

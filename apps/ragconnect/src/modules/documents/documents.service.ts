import { Injectable } from '@nestjs/common';
import { getVectorStore, supabase } from 'src/common/supabae_client';
import { DocumentBase } from 'src/types';
import { DocumentSearchReqDto } from './dtos/documents-req.dto';
import { loadDocuments } from './loader';
import { splitTextDocuments } from 'src/common/text_splitter';
import { SupabaseFilterRPCCall } from '@langchain/community/vectorstores/supabase';
import { v4 as uuidv4 } from "uuid";
import { addDocuments } from './utils/vector';

@Injectable()
export class DocumentsService {
  async list(collectionId: string, limit: number = 10, offset: number = 0): Promise<DocumentBase[]> {
    const { data, error } = await supabase.rpc('get_unique_documents_by_file_id', {
      collection_id: collectionId,
      page_limit: limit,
      page_offset: offset
    });

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      content: r.content,
      metadata: {
        ...r.metadata,
        collectionId
      }
    }));
  }

  async create(payload: { collectionId: string, documents: Record<string, any>[] }) {
    try {
      const { collectionId, documents } = payload;
      const added_chunk_ids: string[] = [];

      for (const document of documents) {

        const docs = await loadDocuments(document);
        const { name, size,created_at } = document;
        const fileId = uuidv4();
        const AddIdToDocs = docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            fileId,
            name,
            size,
            created_at: created_at ??new Date().toISOString(),
          },
        }));
        const docsToSplit = await splitTextDocuments(AddIdToDocs);
        const vectorStore = getVectorStore();
        const ids = await addDocuments(docsToSplit, vectorStore, { collectionId });

        added_chunk_ids.push(...ids);
      }

      return { added_chunk_ids };

    } catch (error) {
      throw error;
    }
  }

  async batchDelete(fileIds: string[]) {
    const { data, error } = await supabase
      .from('documents_embedding')
      .delete()
      .in('metadata->>fileId', fileIds);

    if (error) throw error;

    return { deleted_file_ids: fileIds };
  }

  async searchDocuments(payload: DocumentSearchReqDto) {
    const { collectionId, query, limit } = payload;
    const funcFilter: SupabaseFilterRPCCall = (rpc) =>
      rpc.filter("metadata->>collectionId", "eq", collectionId);
    const vectorStore = getVectorStore();
    const results = await vectorStore.similaritySearchWithScore(query, Number(limit ?? 3), funcFilter);

    return results.map((item) => {
      const [doc, score] = item;
      return {
        id: doc.id,
        content: doc.pageContent,
        metadata: doc.metadata,
        score,
      };
    });
  }
}

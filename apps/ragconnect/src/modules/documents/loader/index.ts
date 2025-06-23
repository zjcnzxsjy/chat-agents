import { loadPDF } from "./pdf_loader";
import { Document } from "@langchain/core/documents";
import { loadPureText } from "./pure_text_loader";

export async function loadDocuments(payload: Record<string, any>): Promise<Document<Record<string, any>>[]> {
  const { type, content } = payload;
  console.log('type', type);
  switch (type) {
    case 'application/pdf':
      const blob = new Blob([content.buffer]);
      return loadPDF(blob);
    case 'text/plain':
      return loadPureText(content.buffer as string);
    default:
      throw new Error('Unsupported document type');
  }
}

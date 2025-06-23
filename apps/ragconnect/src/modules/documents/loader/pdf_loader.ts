import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";

export async function loadPDF(blob: Blob): Promise<Document<Record<string, any>>[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.min.mjs")
  // const pdfjsWorker = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
  // pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  const loader = new PDFLoader(blob, {
    parsedItemSeparator: "",
    pdfjs: () => pdfjs
  });
  return loader.load();
}

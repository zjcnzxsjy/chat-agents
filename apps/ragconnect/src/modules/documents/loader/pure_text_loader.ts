import { Document } from "@langchain/core/documents";

export async function loadPureText(text: string) {
  const docs = [
    new Document({ pageContent: text }),
  ];
  return docs;
}

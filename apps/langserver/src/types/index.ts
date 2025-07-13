export interface CollectionBase {
  name: string;
  metadata: Record<string, any>;
}

export interface CollectionRes extends CollectionBase {
  uuid: string;
  tableId?: string;
}

export interface DocumentBase {
  content: string;
  metadata?: Record<string, any>;
  collectionId: string;
}

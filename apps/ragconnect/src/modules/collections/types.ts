export interface CollectionBase {
  name: string;
  metadata: Record<string, any>;
}

export interface CollectionRes extends CollectionBase {
  id: string;
  tableId?: string;
}


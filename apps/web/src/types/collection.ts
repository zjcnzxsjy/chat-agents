export type Collection = {
  name: string;
  id: string;
  metadata: {
    description?: string;
    [key: string]: any;
  };
};

export type CollectionCreate = {
  name: string;
  metadata: Record<string, any>;
};

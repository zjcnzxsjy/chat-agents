#Lang Server
可以为agent提供知识图谱能力，本项目选择supabase作为数据库。知识范围权限还在设计中
<img width="643" height="792" alt="Image" src="https://github.com/user-attachments/assets/ec3b5eec-862b-4fb9-85a6-c429e03a7a70" />

## Collections
创建一个类别的知识库集合，在chat agent可以选择知识库，提高LLM在问答时的准确率及减少幻觉

### SQL Table
```SQL
create table rag_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 唯一键值
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 数据创建时间
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 数据更新时间

  name TEXT NOT NULL, -- 集合名称
  -- 集合元数据，可以作为扩展使用，
  -- description: 集合描述
  metadata JSONB
);
```

### 接口文档
| 名称            | 路径                         | 方法 | 入参                                                | 出参                                                                                             | 备注                                                                     |
| ----------------- | ------------------------------ | ------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 获取全部集合列表  | /api/collections               | GET    | -                                                     | Array[Collection]<br>id: string //集合id<br>name: string //集合名称<br>metadata: json //集合元数据 | content：切割后的文本<br>metadata: 可扩展，含collectionId      |
| 获取特定集合 | /api/collections/:collectionId | GET    | params<br>collectionId: string                        | Collection<br>id: string //集合id<br>name: string //集合名称<br>metadata: json //集合元数据 | 入参documents是json string，内含文档元信息<br>chunk_id：文本被切割后生成id |
| 添加集合      | /api/collections               | POST   | body<br>name: string<br>metadata: json                | 同上                                                                                             |                                                                            |
| 修改集合数据 | /api/collections?collectionId= | PATCH  | query<br>collectionId: string<br>body: metadata: json | 同上                                                                                             | id: 即fileId                                                              |
| 删除集合数据 | /api/collections?ids=          | DELETE | query<br>ids: string[] 

## Documents
知识库集合内的文档
### SQL
```SQL
-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

create table documents_embedding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 唯一键值
  collection_id UUID, -- 集合id，关联rag_collections表
  content text, -- corresponds to Document.pageContent
  metadata jsonb, -- corresponds to Document.metadata
  embedding vector(2048), -- 2048 works for doubao embeddings, change if needed

  CONSTRAINT fk_collection
        FOREIGN KEY (collection_id)
        REFERENCES rag_collections(id)
        ON DELETE CASCADE
);
```
### 接口文档
| 名称   | 路径                           | 方法 | 入参                                                                          | 出参                                                                       | 备注                                                                     |
| -------- | -------------------------------- | ------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 获取文档 | /api/collection/doucments        | GET    | query<br>collectionId: string<br>limit: number<br>offset: number                | Array[Document]<br>id: string<br>content: string<br>metadata: json           | content：切割后的文本<br>metadata: 可扩展，含collectionId      |
| 创建文档 | /api/collection/documents        | POST   | Form data<br>files: File[]<br>body<br>collectionId: string<br>documents: string | added_chunk_ids: string[]                                                    | 入参documents是json string，内含文档元信息<br>chunk_id：文本被切割后生成id |
| 删除文档 | /api/collection/documents        | DELETE | query<br>fileIds: string[]                                                      | -                                                                            |                                                                            |
| 查询文档 | /api/collection/documents/search | GET    | query<br>collectionId: string<br>query: string<br>limit: number                 | Document<br>id: string<br>content: string<br>metadata: json<br>score: number | id: 即fileId                                                              |





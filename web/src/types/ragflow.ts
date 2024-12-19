
// Session 类型定义
export interface Reference {
  content: string;
  dataset_id: string;
  document_id: string;
  document_name: string;
  id: string;
  image_id: string;
  positions: number[];
  similarity: number;
  term_similarity: number;
  vector_similarity: number;
}

export interface Message {
  content: string;
  role: 'assistant' | 'user';
  id?: string;
  doc_ids?: string[];
  reference?: Reference[];
}

export interface Session {
  id: string;
  chat_id: string;
  name: string;
  messages: Message[];
  create_date: string;
  create_time: number;
  update_date: string;
  update_time: number;
}

export interface SessionListResponse {
  code: number;
  data: Session[];
  message?: string;
}

export interface SessionResponse {
  code: number;
  data: Session;
}

export interface BaseResponse {
  code: number;
  message?: string;
}

// 请求参数类型定义
export interface CreateSessionParams {
  name: string;
}

export interface UpdateSessionParams {
  name: string;
}

export interface ListSessionsParams {
  page?: number;
  page_size?: number;
  orderby?: 'create_time' | 'update_time';
  desc?: boolean;
  name?: string;
  id?: string;
}

export interface DeleteSessionsParams {
  ids: string[];
} 
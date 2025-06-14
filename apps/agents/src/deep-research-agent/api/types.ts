export interface Config {
  apiKey: string;
  basePath?: string;
  apiHost?: string;
} 

export interface TinyUrlResponse {
  tiny_url: string;
  url: string;
  description: string;
  domain: string;
  created_at: string
}
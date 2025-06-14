import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Config } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import { AuthError, RequestError } from './exceptions.js';

export class RequestAPI {
  private config: Config;
  private baseURL: string;
  private session: ReturnType<typeof axios.create>;

  constructor(config: Config) {
    this.config = config;
    this.baseURL = config.apiHost || 'https://api.tinyurl.com';
    this.session = axios.create({
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      }
    });
  }

  private getHeaders(hasFiles: boolean = false) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    // Set Content-Type based on whether files are being uploaded
    if (!hasFiles) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async makeRequest<T>(endpoint: string, data: any, method: string = 'POST'): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const hasFiles = !!data.files;
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: this.getHeaders(hasFiles),
    };

    if (method.toUpperCase() === 'GET') {
      config.params = data;
    } else {
      // Handle file uploads
      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();
        const files = data.files;
        delete data.files;

        // Add other data to FormData
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            formData.append(key, String(value));
          }
        }

        // Add files
        for (const [fieldName, fileInfo] of Object.entries(files)) {
          const filePath = (fileInfo as any).path;
          if (filePath && fs.existsSync(filePath)) {
            const fileName = path.basename(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            const fileBlob = new Blob([fileBuffer]);
            formData.append(fieldName, fileBlob, fileName);
          }
        }

        config.data = formData;
      } else {
        config.data = data;
      }
    }

    try {
      const response = await this.session.request(config);

      // Check for error codes in response data
      const baseResp = response.data?.base_resp;
      if (baseResp && baseResp.status_code !== 0) {
        throw new RequestError(
          `API Error: ${baseResp.status_msg} ` +
          `Trace ID: ${response.headers['trace-id']}`
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof AuthError || error instanceof RequestError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          throw new RequestError(
            `Request failed (${axiosError.response.status}): ${axiosError.response.statusText}. ` +
            `Response content: ${JSON.stringify(axiosError.response.data)}`
          );
        } else if (axiosError.request) {
          throw new RequestError(
            `Request sent but no response received, possibly a network issue: ${axiosError.message}`
          );
        } else {
          throw new RequestError(`Request error: ${axiosError.message}`);
        }
      }

      throw new RequestError(`Unknown error: ${String(error)}`);
    }
  }

  async get<T>(endpoint: string, params: any = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, params, 'GET');
  }

  async post<T>(endpoint: string, data: any = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, data, 'POST');
  }
}
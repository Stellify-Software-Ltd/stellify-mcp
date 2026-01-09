import axios, { AxiosInstance } from 'axios';

export interface StellifyConfig {
  apiUrl: string;
  apiToken: string;
}

export interface CreateFileParams {
  directory?: string; // UUID of directory, or omit to auto-detect from type
  name: string;
  type: 'class' | 'model' | 'controller' | 'middleware';
  namespace?: string;
}

export interface CreateMethodParams {
  file: string; // File UUID
  name: string;
  visibility?: 'public' | 'protected' | 'private';
  is_static?: boolean;
  returnType?: string;
  parameters?: Array<{
    name: string;
    type: string;
  }>;
}

export interface AddMethodBodyParams {
  file_uuid: string;
  method_uuid: string;
  code: string;
}

export interface SearchMethodsParams {
  name?: string;
  file_uuid?: string;
}

export interface SearchFilesParams {
  query: string;
  type?: string;
  project?: boolean;
  includes?: boolean;
  include_metadata?: boolean;
  per_page?: number;
  category?: string;
  min_rating?: number;
  tags?: string[];
  user?: string;
  sort?: 'created_at' | 'name' | 'type' | 'ai_rating' | 'usage_rating' | 'system_rating' | 'user_name';
  direction?: 'asc' | 'desc';
}

export class StellifyClient {
  private client: AxiosInstance;

  constructor(config: StellifyConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async createFile(params: CreateFileParams) {
    const response = await this.client.post('/file', params);
    return response.data;
  }

  async createMethod(params: CreateMethodParams) {
    const response = await this.client.post('/method', params);
    return response.data;
  }

  async addMethodBody(params: AddMethodBodyParams) {
    const response = await this.client.post('/code', params);
    return response.data;
  }

  async searchMethods(params: SearchMethodsParams) {
    const response = await this.client.get('/method/search', { params });
    return response.data;
  }

  async searchFiles(params: SearchFilesParams) {
    const response = await this.client.get('/file/search', { params });
    return response.data;
  }

  async getFile(uuid: string) {
    const response = await this.client.get(`/file/${uuid}`);
    return response.data;
  }

  async getMethod(uuid: string) {
    const response = await this.client.get(`/method/${uuid}`);
    return response.data;
  }
}

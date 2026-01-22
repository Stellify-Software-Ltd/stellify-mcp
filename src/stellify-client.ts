import axios, { AxiosInstance } from 'axios';

export interface StellifyConfig {
  apiUrl: string;
  apiToken: string;
}

export interface CreateFileParams {
  directory?: string; // UUID of directory, or omit to auto-detect from type
  name: string;
  type: 'class' | 'model' | 'controller' | 'middleware' | 'js';
  namespace?: string;
  extension?: string;
  code?: string; // Complete PHP code to analyze for dependencies
  auto_create_dependencies?: boolean; // If true, create missing dependencies from code
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
  file: string;
  method: string;
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

export interface CreateRouteParams {
  project_id: string;
  name: string;
  path: string;
  method: string;
  type?: string;
  data?: any;
}

export interface CreateElementParams {
  type: string;
  page?: string;
  parent?: string;
}

export class StellifyClient {
  public client: AxiosInstance;

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

  async addStatementCode(params: { file: string; statement: string; code: string }) {
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

  async saveFile(uuid: string, data: any) {
    const response = await this.client.put(`/file/${uuid}`, data);
    return response.data;
  }

  async getMethod(uuid: string) {
    const response = await this.client.get(`/method/${uuid}`);
    return response.data;
  }

  async saveMethod(uuid: string, data: any) {
    const response = await this.client.put(`/method/${uuid}`, data);
    return response.data;
  }

  async createStatement(params: { file?: string; method?: string }) {
    const response = await this.client.post('/statement', params);
    return response.data;
  }

  async getStatement(uuid: string) {
    const response = await this.client.get(`/statement/${uuid}`);
    return response.data;
  }

  async saveStatement(uuid: string, data: any) {
    const response = await this.client.put(`/statement/${uuid}`, data);
    return response.data;
  }

  async createRoute(params: CreateRouteParams) {
    const response = await this.client.post('/route', params);
    return response.data;
  }

  async getRoute(uuid: string) {
    const response = await this.client.get(`/route/${uuid}`);
    return response.data;
  }

  async searchRoutes(params: { search?: string; type?: string }) {
    const response = await this.client.get('/route/search', { params });
    return response.data;
  }

  async createElement(params: CreateElementParams) {
    const response = await this.client.post('/element', params);
    return response.data;
  }

  async updateElement(uuid: string, data: any) {
    const response = await this.client.put(`/element/${uuid}`, data);
    return response.data;
  }

  async getElement(uuid: string) {
    const response = await this.client.get(`/element/${uuid}`);
    return response.data;
  }

  async getElementTree(uuid: string) {
    const response = await this.client.get(`/element/${uuid}/tree`);
    return response.data;
  }

  async deleteElement(uuid: string, page?: string, current?: string) {
    const pageParam = page || 'null';
    const currentParam = current || 'null';
    const response = await this.client.delete(`/element/${pageParam}/${currentParam}/${uuid}`);
    return response.data;
  }

  async searchElements(params: {
    search?: string;
    type?: string;
    include_metadata?: boolean;
    per_page?: number;
  }) {
    const response = await this.client.get('/element/search', { params });
    return response.data;
  }

  async htmlToElements(params: {
    elements: string;
    page?: string;
    selection?: string;
    test?: boolean;
  }) {
    const response = await this.client.post('/html/elements', params);
    return response.data;
  }

  // Global methods (Application DB)
  async listGlobals() {
    const response = await this.client.get('/globals/');
    return response.data;
  }

  async getGlobal(uuid: string) {
    const response = await this.client.get(`/globals/file/${uuid}`);
    return response.data;
  }

  async installGlobal(params: { file_uuid: string; directory_uuid: string }) {
    const response = await this.client.post('/globals/install', params);
    return response.data;
  }

  async searchGlobalMethods(params: { query: string }) {
    const response = await this.client.post('/method/search-global', params);
    return response.data;
  }

  // Module methods (groups of globals)
  async listModules() {
    const response = await this.client.get('/modules/');
    return response.data;
  }

  async getModule(uuid: string) {
    const response = await this.client.get(`/modules/${uuid}`);
    return response.data;
  }

  async createModule(params: { name: string; description?: string; version?: string; tags?: string[] }) {
    const response = await this.client.post('/modules/', params);
    return response.data;
  }

  async addFileToModule(params: { module_uuid: string; file_uuid: string; order?: number }) {
    const response = await this.client.post('/modules/add-file', params);
    return response.data;
  }

  async removeFileFromModule(moduleUuid: string, fileUuid: string) {
    const response = await this.client.delete(`/modules/${moduleUuid}/file/${fileUuid}`);
    return response.data;
  }

  async installModule(params: { module_uuid: string; directory_uuid: string }) {
    const response = await this.client.post('/modules/install', params);
    return response.data;
  }

  async deleteModule(uuid: string) {
    const response = await this.client.delete(`/modules/${uuid}`);
    return response.data;
  }

  // Directory methods
  async getDirectory(uuid: string) {
    const response = await this.client.get(`/directory/${uuid}`);
    return response.data;
  }

  async createDirectory(params: { name: string }) {
    const response = await this.client.post('/directory', params);
    return response.data;
  }

  async saveDirectory(uuid: string, data: any) {
    const response = await this.client.put(`/directory/${uuid}`, { uuid, data });
    return response.data;
  }

  // Project methods
  async getProject() {
    const response = await this.client.get('/getProject');
    return response.data;
  }
}

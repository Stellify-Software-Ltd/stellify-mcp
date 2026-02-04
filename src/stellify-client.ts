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
  file?: string;
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

  async getFile(file: string) {
    const response = await this.client.get(`/file/${file}`);
    return response.data;
  }

  async saveFile(file: string, data: any) {
    const response = await this.client.put(`/file/${file}`, data);
    return response.data;
  }

  async getMethod(method: string) {
    const response = await this.client.get(`/method/${method}`);
    return response.data;
  }

  async saveMethod(method: string, data: any) {
    const response = await this.client.put(`/method/${method}`, data);
    return response.data;
  }

  async createStatement(params: { file?: string; method?: string }) {
    const response = await this.client.post('/statement', params);
    return response.data;
  }

  async getStatement(statement: string) {
    const response = await this.client.get(`/statement/${statement}`);
    return response.data;
  }

  async saveStatement(statement: string, data: any) {
    const response = await this.client.put(`/statement/${statement}`, data);
    return response.data;
  }

  async createRoute(params: CreateRouteParams) {
    const response = await this.client.post('/route', params);
    return response.data;
  }

  async getRoute(route: string) {
    const response = await this.client.get(`/route/${route}`);
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

  async updateElement(element: string, data: any) {
    const response = await this.client.put(`/element/${element}`, data);
    return response.data;
  }

  async getElement(element: string) {
    const response = await this.client.get(`/element/${element}`);
    return response.data;
  }

  async getElementTree(element: string) {
    const response = await this.client.get(`/element/${element}/tree`);
    return response.data;
  }

  async deleteElement(uuid: string) {
    const response = await this.client.delete(`/element/${uuid}`);
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

  // Element command broadcast (real-time UI updates via WebSocket)
  async broadcastElementCommand(params: {
    action: 'update' | 'batch' | 'delete' | 'create';
    element?: string;
    changes?: Record<string, any>;
    updates?: Array<{ element: string; changes: Record<string, any> }>;
  }) {
    const response = await this.client.post('/elements/command', params);
    return response.data;
  }

  // Resource scaffolding - create Model, Controller, Service, Migration in one call
  async createResources(params: {
    name: string;
    fields?: Array<{
      name: string;
      type?: string;
      nullable?: boolean;
      unique?: boolean;
      required?: boolean;
      default?: any;
      max?: number;
    }>;
    relationships?: Array<{
      type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
      model: string;
      name?: string;
    }>;
    controller?: boolean;
    service?: boolean;
    migration?: boolean;
    routes?: boolean;
    soft_deletes?: boolean;
    api?: boolean;
  }) {
    const response = await this.client.post('/resources', params);
    return response.data;
  }

  // Code execution - runs a specific method by file and method UUID
  async runCode(params: {
    file: string;
    method: string;
    args?: any[];
    timeout?: number;
    benchmark?: boolean;
  }) {
    const { file, method, ...body } = params;
    if (!file || !method) {
      throw new Error('Both file and method UUIDs are required to run code');
    }
    const response = await this.client.put(`/code/${file}/${method}`, body);
    return response.data;
  }

  // Framework capabilities - list what's available
  async getCapabilities() {
    const response = await this.client.get('/capabilities');
    return response.data;
  }

  // Request a missing capability - logs to backlog
  async requestCapability(params: {
    capability: string;
    description: string;
    use_case: string;
    workaround?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }) {
    const response = await this.client.post('/capabilities/request', params);
    return response.data;
  }

  // Project modules - organizational grouping for AI-created code

  async listProjectModules() {
    const response = await this.client.get('/project-modules');
    return response.data;
  }

  async getProjectModule(uuid: string) {
    const response = await this.client.get(`/project-modules/${uuid}`);
    return response.data;
  }

  async createProjectModule(params: {
    name: string;
    description?: string;
  }) {
    const response = await this.client.post('/project-modules', params);
    return response.data;
  }

  async addFileToProjectModule(params: {
    module: string; // UUID or name
    file_uuid: string;
  }) {
    const response = await this.client.post('/project-modules/add-file', params);
    return response.data;
  }

  async addRouteToProjectModule(params: {
    module: string; // UUID or name
    route_uuid: string;
  }) {
    const response = await this.client.post('/project-modules/add-route', params);
    return response.data;
  }
}

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
  attributes?: string[]; // PHP 8 class-level attributes (e.g., ["Fillable(['name', 'email'])"])
}

export interface CreateMethodParams {
  file: string; // File UUID
  name: string;
  visibility?: 'public' | 'protected' | 'private';
  is_static?: boolean;
  is_async?: boolean; // NEW: Set to true for async methods (Vue/JS methods using await)
  returnType?: string;
  nullable?: boolean;
  parameters?: Array<{
    name: string;
    type?: string;
    datatype?: string;
    value?: string;
  }>;
  body?: string; // NEW: Method body code - if provided, automatically parses and adds code
  attributes?: string[]; // PHP 8 attributes (e.g., ["Deprecated", "Route('/api/users')"])
}

export interface AddMethodBodyParams {
  file: string;
  method: string;
  code: string;
  types?: Record<string, string>;
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
  controller?: string;
  controller_method?: string;
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

  async deleteFile(directory: string, file: string) {
    const response = await this.client.delete(`/file/${directory}/${file}`);
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

  async deleteMethod(file: string, method: string) {
    const response = await this.client.delete(`/method/${file}/${method}`);
    return response.data;
  }

  async createStatement(params: { file?: string; method?: string }) {
    const response = await this.client.post('/statement', params);
    return response.data;
  }

  // NEW: Combined create statement with code in a single call
  async createStatementWithCode(params: { file: string; code: string; method?: string; types?: Record<string, string> }) {
    const response = await this.client.post('/statement/with-code', params);
    return response.data;
  }

  async getStatement(statement: string) {
    const response = await this.client.get(`/statement/${statement}`);
    return response.data;
  }

  async deleteStatement(file: string, method: string, statement: string) {
    const response = await this.client.delete(`/statement/${file}/${method}/${statement}`);
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

  async saveRoute(route: string, data: any) {
    const response = await this.client.put(`/route/${route}`, { uuid: route, ...data });
    return response.data;
  }

  async deleteRoute(route: string) {
    const response = await this.client.delete(`/route/${route}`);
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
    file?: string;
    test?: boolean;
  }) {
    const response = await this.client.post('/html/elements', params);
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

  // Semantic + facet search over the reusable-code index. Returns compact candidates
  // (summary + facets + fit score), never code.
  async searchCode(params: {
    query: string;
    required_facets?: Record<string, string[]>;
    limit?: number;
    project_id?: string;
    rerank?: boolean;
  }) {
    const response = await this.client.post('/reuse/search', params);
    return response.data;
  }

  // Clone a matched unit's dependency closure into the active project.
  async reuseCode(params: { files?: string[]; routes?: string[] }) {
    const response = await this.client.post('/reuse', params);
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

  // Apply a migration against the project's tenant database (creates/updates tables).
  // Migrations need elevated Schema/DDL privileges that the sandboxed run_code path
  // forbids, so they run through their own endpoint.
  async runMigration(file: string) {
    if (!file) {
      throw new Error('A migration file UUID is required');
    }
    const response = await this.client.post(`/code/run-migration/${file}`);
    return response.data;
  }

  // Publish (bundle) a Vue component tree into an ESM loader served at /esm and attach
  // its import-map to the page route, so the component renders without the editor.
  async publish(params: {
    uuid: string;
    route?: string;
    filename?: string;
    mode?: 'bundle' | 'esm';
  }) {
    if (!params.uuid) {
      throw new Error('An entry file UUID (the app.js mount file) is required to publish');
    }
    const response = await this.client.post('/publish', params);
    return response.data;
  }

  // Capabilities catalog - list libraries/services that can be enabled for the project.
  // Returns the global catalog with each capability's type (npm/composer), packages,
  // config requirements, and whether it's currently enabled for the active project.
  async listCapabilities(params: { category?: string; type?: 'npm' | 'composer' } = {}) {
    const response = await this.client.get('/capabilities', { params });
    return response.data;
  }

  // Enable or disable a capability for the active project. Enabling adds it to the
  // project so its packages are emitted into composer.json/package.json at build/export.
  async setCapability(name: string, status: 'available' | 'not_available') {
    const response = await this.client.put(`/capabilities/${name}`, { status });
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

  // Performance analysis - analyze execution logs for optimization opportunities
  async analyzePerformance(params: {
    type?: 'full' | 'slow_methods' | 'high_query_methods' | 'high_memory_methods' | 'failure_rates' | 'trend';
    days?: number;
    limit?: number;
  }) {
    const type = params.type || 'full';
    const queryParams: Record<string, any> = {};

    if (params.days) queryParams.days = params.days;
    if (params.limit) queryParams.limit = params.limit;

    // Map type to endpoint
    const endpoint = type === 'full' ? '/performance/analyze' :
                     type === 'slow_methods' ? '/performance/slow-methods' :
                     type === 'high_query_methods' ? '/performance/high-query-methods' :
                     type === 'high_memory_methods' ? '/performance/high-memory-methods' :
                     type === 'failure_rates' ? '/performance/failure-rates' :
                     type === 'trend' ? '/performance/trend' :
                     '/performance/analyze';

    const response = await this.client.get(endpoint, { params: queryParams });
    return response.data;
  }

  // Code quality analysis - analyze Laravel structure for issues
  async analyzeQuality(params: {
    type?: 'full' | 'relationships' | 'fillables' | 'casts' | 'routes';
  }) {
    const type = params.type || 'full';

    // Map type to endpoint
    const endpoint = type === 'full' ? '/quality/analyze' :
                     type === 'relationships' ? '/quality/relationships' :
                     type === 'fillables' ? '/quality/fillables' :
                     type === 'casts' ? '/quality/casts' :
                     type === 'routes' ? '/quality/routes' :
                     '/quality/analyze';

    const response = await this.client.get(endpoint);
    return response.data;
  }

  // Settings/Config management - for tenant-specific configuration
  // These settings are read by the config() override in sandbox code execution

  async getSetting(name: string) {
    const response = await this.client.get(`/config/${name}`);
    return response.data;
  }

  async saveSetting(name: string, data: Record<string, any>) {
    const response = await this.client.put(`/config/${name}`, { data });
    return response.data;
  }

  async createSetting(name: string) {
    const response = await this.client.post('/config', { name });
    return response.data;
  }

  async deleteSetting(name: string) {
    const response = await this.client.delete(`/config/${name}`);
    return response.data;
  }

  // Code Assembly - get rendered source code for a file
  async getAssembledCode(uuid: string) {
    const response = await this.client.get(`/file/${uuid}/source`);
    return response.data;
  }

  // Search PHP 8 attributes - returns categories, category attributes, or search results
  async searchAttributes(params: {
    query?: string;
    category?: string;
    target?: 'class' | 'method' | 'property' | 'parameter';
  }) {
    const response = await this.client.get('/attributes/search', { params });
    return response.data;
  }

  // Analyze PHP 8 attribute usage across a project
  async analyzeAttributes(params: {
    mode?: 'usage' | 'missing' | 'search';
    file_type?: string;
    attribute?: string;
    value?: string;
  }) {
    const response = await this.client.get('/attributes/analyze', { params });
    return response.data;
  }

  // Foundation packages - install pre-built packages into a project
  async installPackage(name: string) {
    const response = await this.client.post('/packages/install', { name });
    return response.data;
  }

}

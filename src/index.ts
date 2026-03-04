#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { StellifyClient } from './stellify-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_URL = process.env.STELLIFY_API_URL || 'https://stellisoft.com/api/v1';
const API_TOKEN = process.env.STELLIFY_API_TOKEN;

if (!API_TOKEN) {
  console.error('Error: STELLIFY_API_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Stellify API client
const stellify = new StellifyClient({
  apiUrl: API_URL,
  apiToken: API_TOKEN,
});

// Define MCP tools
// Stellify Framework API - full method reference for AI code generation
const STELLIFY_FRAMEWORK_API = {
  // Data & Forms
  Form: ['create', 'set', 'get', 'getData', 'validate', 'isValid', 'getErrors', 'getError', 'reset', 'store', 'update', 'delete'],
  Table: ['create', 'setData', 'addColumn', 'removeColumn', 'sort', 'filter', 'clearFilter', 'paginate', 'page', 'getData', 'getAllData', 'getColumns', 'getColumn', 'getTotalRows', 'getTotalPages', 'getCurrentPage', 'getPageSize', 'getSortKey', 'getSortDirection'],
  List: ['create', 'from', 'range', 'add', 'remove', 'removeWhere', 'set', 'get', 'first', 'last', 'sort', 'sortBy', 'reverse', 'filter', 'find', 'findIndex', 'map', 'reduce', 'forEach', 'includes', 'indexOf', 'every', 'some', 'slice', 'take', 'skip', 'chunk', 'unique', 'uniqueBy', 'groupBy', 'flatten', 'concat', 'isEmpty', 'isNotEmpty', 'count', 'clear', 'toArray', 'toJSON', 'clone', 'sum', 'avg', 'min', 'max'],
  Tree: ['create', 'setRoot', 'addChild', 'removeNode', 'getNode', 'getRoot', 'getChildren', 'getParent', 'getSiblings', 'getAncestors', 'getDescendants', 'getDepth', 'getPath', 'traverse', 'find', 'findAll', 'move', 'toArray', 'size'],
  // Network
  Http: ['create', 'get', 'post', 'put', 'patch', 'delete', 'items', 'withHeaders', 'withToken', 'withTimeout'],
  Socket: ['create', 'connect', 'disconnect', 'send', 'sendEvent', 'on', 'off', 'once', 'isConnected', 'getState'],
  Auth: ['create', 'login', 'logout', 'fetchUser', 'getUser', 'getToken', 'isAuthenticated', 'setToken', 'setUser', 'refresh', 'onAuthChange', 'offAuthChange', 'getAuthHeader'],
  Stream: ['create', 'headers', 'withToken', 'onChunk', 'onComplete', 'onError', 'get', 'post', 'abort', 'getBuffer', 'getChunks', 'isStreaming', 'clear'],
  // Graphics & Visualization
  Svg: ['create', 'select', 'find', 'attr', 'attrs', 'getAttr', 'addClass', 'removeClass', 'text', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'textElement', 'group', 'clear', 'remove', 'toString', 'toElement', 'getWidth', 'getHeight'],
  Canvas: ['create', 'fromElement', 'fromSelector', 'size', 'getWidth', 'getHeight', 'style', 'save', 'restore', 'clear', 'fill', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'arc', 'path', 'text', 'measureText', 'drawImage', 'translate', 'rotate', 'scale', 'resetTransform', 'getPixel', 'setPixel', 'getImageData', 'putImageData', 'toDataURL', 'toBlob', 'getElement', 'getContext', 'appendTo'],
  Graph: ['create', 'size', 'addNode', 'removeNode', 'addEdge', 'removeEdge', 'getNode', 'getNodes', 'getEdges', 'getEdgesWithPositions', 'getNeighbors', 'layout'],
  Scale: ['linear', 'log', 'time', 'band', 'domain', 'range', 'getDomain', 'getRange', 'value', 'invert', 'ticks', 'clamp', 'padding', 'bandwidth'],
  Axis: ['create', 'orientation', 'ticks', 'tickFormat', 'tickSize', 'getTicks', 'getOrientation', 'getTickSize', 'getRange', 'isHorizontal', 'isVertical'],
  Motion: ['tween', 'spring', 'easing', 'onUpdate', 'onComplete', 'start', 'stop', 'isRunning', 'valueAt'],
  // Platform APIs
  Router: ['create', 'register', 'navigate', 'back', 'forward', 'getParams', 'getQuery', 'getCurrent', 'getState', 'onNavigate', 'offNavigate', 'start'],
  Storage: ['local', 'session', 'set', 'get', 'remove', 'clear', 'has', 'keys', 'getAll', 'size'],
  Events: ['create', 'on', 'off', 'once', 'emit', 'clear', 'listenerCount', 'eventNames'],
  Clipboard: ['copy', 'paste', 'copyImage', 'copyHtml', 'isSupported', 'isWriteSupported'],
  Notify: ['request', 'send', 'getPermission', 'isSupported', 'isGranted', 'isDenied'],
  Geo: ['getPosition', 'watchPosition', 'stopWatching', 'stopAllWatching', 'isSupported', 'distance'],
  Media: ['selectFile', 'selectFiles', 'capture', 'getMetadata', 'resize', 'toBase64', 'toArrayBuffer', 'toText', 'formatSize', 'isImage', 'isVideo', 'isAudio'],
  DB: ['create', 'store', 'open', 'close', 'put', 'add', 'get', 'getAll', 'find', 'delete', 'clear', 'count', 'keys', 'update', 'batch', 'deleteDatabase', 'databases'],
  Worker: ['create', 'fromFunction', 'fromCode', 'run', 'post', 'onMessage', 'onError', 'terminate', 'isRunning', 'getPendingCount'],
  WorkerPool: ['create', 'fromFunction', 'run', 'map', 'terminate', 'getSize', 'getActiveCount', 'getQueueLength'],
  // AI & Language
  Speech: ['create', 'isSupported', 'listen', 'stopListening', 'onResult', 'onInterim', 'onEnd', 'onError', 'speak', 'stopSpeaking', 'pause', 'resume', 'getVoices', 'getVoicesByLanguage', 'isSpeaking', 'isListening'],
  Chat: ['create', 'fromHistory', 'addMessage', 'addUser', 'addAssistant', 'addSystem', 'getMessage', 'getHistory', 'getMessages', 'getLastMessage', 'getLastUserMessage', 'getLastAssistantMessage', 'updateMessage', 'removeMessage', 'clear', 'clearAll', 'fork', 'truncate', 'count', 'countTokensEstimate', 'toJSON'],
  Embed: ['create', 'store', 'storeMany', 'get', 'remove', 'clear', 'count', 'compare', 'nearest', 'search', 'cosineSimilarity', 'euclideanDistance', 'dotProduct', 'normalize', 'average', 'toJSON', 'fromJSON'],
  Diff: ['chars', 'words', 'lines', 'apply', 'createPatch', 'distance', 'similarity', 'commonPrefix', 'commonSuffix'],
  // Utilities
  Time: ['now', 'create', 'parse', 'format', 'toISO', 'toDate', 'toTimestamp', 'toUnix', 'add', 'subtract', 'diff', 'isBefore', 'isAfter', 'isSame', 'isBetween', 'startOf', 'endOf', 'year', 'month', 'day', 'weekday', 'hour', 'minute', 'second', 'relative', 'clone'],
  // Adapters
  useStellify: ['(generic adapter for any module)'],
  useForm: ['bind'],
  useTable: ['(reactive table adapter)'],
};

const tools: Tool[] = [
  {
    name: 'get_stellify_framework_api',
    description: `Get the complete Stellify Framework API reference for Vue/JS development.

Returns all modules and their methods for AI-friendly frontend code generation.

Use this tool when you need to:
- Look up available methods for a Stellify module
- Verify method names before generating code
- Understand the full API surface

IMPORTANT - Stellify Framework Import:
The npm package is "stellify-framework" (NOT @stellify/core).
Import like: import { Http, List, Form } from 'stellify-framework';

IMPORTANT - List class and Vue reactivity:
List is iterable and works directly with Vue's v-for directive.
Use List.from() to wrap arrays for chainable operations (filter, map, sort, etc.).

Example response:
{
  "Form": ["create", "set", "get", "validate", "store", "update", "delete", ...],
  "Http": ["create", "get", "post", "put", "delete", "withToken", ...],
  ...
}`,
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          description: 'Optional: specific module to get API for (e.g., "Form", "Http"). Omit to get all modules.',
        },
      },
    },
  },
  {
    name: 'get_project',
    description: `Get the active Stellify project for the authenticated user.

IMPORTANT: Call this first before any other operations.

Returns:
- uuid: Project UUID (needed for most operations)
- name: Project name
- branch/branches: Git branch info
- directories: Array of {uuid, name} for existing directories (js, controllers, models, etc.)

Use the directories array to find existing directories before creating new ones.
For example, look for a "js" directory before creating Vue components.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_file',
    description: `Create a new file in a Stellify project.

This creates an EMPTY file shell - no methods, statements, or template yet. The file exists but has no content.

COMPLETE WORKFLOW:
1. create_file → creates empty shell, returns file UUID
2. create_statement_with_code → add variables/imports in ONE call (returns statement UUIDs)
3. create_method with body param → add functions in ONE call (returns method UUIDs)
4. html_to_elements → create template elements (returns element UUIDs)
5. save_file → FINALIZE by wiring template/data arrays with all collected UUIDs

LEGACY (still supported but prefer combined tools above):
- create_statement + add_statement_code (2 calls instead of 1)
- create_method + add_method_body + save_method for is_async (3 calls instead of 1)

For PHP: Use type='class', 'model', 'controller', or 'middleware'.
For Vue: Use type='js' and extension='vue'. Place in the 'js' directory.
  - Auto-creates app.js (check response.appJs)
  - Auto-creates template route for visual editor (check response.templateRoute.uuid)

DEPENDENCY RESOLUTION (automatic):
Pass 'includes' as an array of namespace strings for FRAMEWORK classes (e.g., ["Illuminate\\Http\\Request", "Illuminate\\Support\\Facades\\Hash"]).
The system resolves these to UUIDs automatically:
- Illuminate\\*/Laravel\\* → fetches from Laravel API, creates in Application DB
- Vendor packages → fetches from vendor, creates in Application DB

NOTE: For controllers that use PROJECT models (Feedback, Vote, etc.), add those to the 'models' array in save_file instead. Do NOT put project models in includes - this causes duplicate use statement errors.`,
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'The UUID of the directory to create the file in (get from get_project directories array)',
        },
        name: {
          type: 'string',
          description: 'File name without extension (e.g., "Counter", "UserController")',
        },
        type: {
          type: 'string',
          enum: ['class', 'model', 'controller', 'middleware', 'js'],
          description: 'Type of file: "js" for JavaScript/Vue, others for PHP',
        },
        extension: {
          type: 'string',
          description: 'File extension. Use "vue" for Vue components, omit for PHP files.',
        },
        namespace: {
          type: 'string',
          description: 'PHP namespace (e.g., "App\\Services\\"). Only for PHP files.',
        },
        includes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of namespace strings to include as dependencies (e.g., ["App\\Models\\User", "Illuminate\\Support\\Facades\\Hash"]). These are resolved to UUIDs automatically.',
        },
        module: {
          type: 'string',
          description: 'Optional module name to group this file with related code (e.g., "blog-posts", "user-auth"). Module is auto-created if it doesn\'t exist.',
        },
      },
      required: ['directory', 'name', 'type'],
    },
  },
  {
    name: 'create_method',
    description: `Create a method in a file. Can optionally include the body and async flag in a single call.

**NEW: Combined creation** - Pass 'body' to create the complete method in ONE call. Async is auto-detected when body contains \`await\`.

**Nested code is handled correctly.** The parser tracks brace/bracket/paren depth and only splits statements on semicolons at the top level. This means computed properties, arrow functions with block bodies, and other nested constructs work correctly as single statements.

Parameters are automatically created as clauses. The response includes the clause UUIDs for each parameter.

Example request (simple - signature only):
{
  "file": "file-uuid",
  "name": "verify",
  "visibility": "public",
  "returnType": "object",
  "nullable": true,
  "parameters": [
    { "name": "credentials", "datatype": "array" }
  ]
}

Example request (combined - with body, async auto-detected):
{
  "file": "file-uuid",
  "name": "fetchData",
  "body": "const response = await Http.get('/api/data');\\nreturn response.data;"
}

Example response includes:
{
  "uuid": "method-uuid",
  "name": "fetchData",
  "is_async": true,
  "parameters": ["clause-uuid-for-credentials"],
  "statements": {...},  // Only if body was provided
  "clauses": {...}      // Only if body was provided
}`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file to add the method to',
        },
        name: {
          type: 'string',
          description: 'Method name (e.g., "increment", "store", "handleClick")',
        },
        visibility: {
          type: 'string',
          enum: ['public', 'protected', 'private'],
          description: 'Method visibility (PHP only)',
        },
        is_static: {
          type: 'boolean',
          description: 'Whether the method is static (PHP only)',
        },
        is_async: {
          type: 'boolean',
          description: 'Whether the method is async (JavaScript/Vue only). Set to true for methods that use await.',
        },
        returnType: {
          type: 'string',
          description: 'Return type (e.g., "int", "string", "void", "object")',
        },
        nullable: {
          type: 'boolean',
          description: 'Whether the return type is nullable (e.g., ?object)',
        },
        parameters: {
          type: 'array',
          description: 'Array of method parameters. Each parameter is created as a clause.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Parameter name (e.g., "credentials", "id")',
              },
              datatype: {
                type: 'string',
                description: 'Parameter data type (e.g., "array", "int", "string", "Request")',
              },
              type: {
                type: 'string',
                description: 'Clause type, defaults to "variable"',
              },
              value: {
                type: 'string',
                description: 'Parameter value, defaults to the name',
              },
            },
            required: ['name'],
          },
        },
        body: {
          type: 'string',
          description: 'Method body code (optional). If provided, automatically parses and adds the code. Example: "const response = await Http.get(\\"/api/data\\");\\nreturn response.data;"',
        },
      },
      required: ['file', 'name'],
    },
  },
  {
    name: 'add_method_body',
    description: `Parse and add PHP code to a method body. Provide the method implementation code (without the function declaration). Stellify will parse it into structured statements.

**Nested code is handled correctly.** The parser tracks brace/bracket/paren depth and only splits on semicolons at the top level. Arrow functions with block bodies, computed properties, and other nested constructs work as single statements.

IMPORTANT: This APPENDS to existing method statements. To REPLACE a method's code:
1. Create a NEW method with create_method
2. Add body with add_method_body
3. Update the file's 'data' array to include new method UUID (remove old one)
4. Update any element click handlers to reference the new method UUID
5. Optionally delete the old method with delete_method`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file containing the method',
        },
        method: {
          type: 'string',
          description: 'UUID of the method to add code to',
        },
        code: {
          type: 'string',
          description: 'PHP code for the method body (just the statements, no function declaration). Example: "return $a + $b;"',
        },
      },
      required: ['file', 'method', 'code'],
    },
  },
  {
    name: 'save_method',
    description: `Update an existing method's properties (name, visibility, returnType, nullable, parameters, data, is_async).

Use this to modify a method after creation. For updating the method body, use add_method_body instead.

Parameters:
- data: Array of statement UUIDs that form the method body. Use this to reorder statements or remove unwanted statements from the method.
- is_async: Set to true for JavaScript/Vue methods that use await.

Example - Update return type:
{
  "uuid": "method-uuid",
  "returnType": "object",
  "nullable": true
}

Example - Mark method as async (for methods using await):
{
  "uuid": "method-uuid",
  "is_async": true
}

Example - Remove duplicate/unwanted statements:
{
  "uuid": "method-uuid",
  "data": ["statement-uuid-1", "statement-uuid-2"]  // Only keep these statements
}`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the method to update',
        },
        name: {
          type: 'string',
          description: 'Method name',
        },
        visibility: {
          type: 'string',
          enum: ['public', 'protected', 'private'],
          description: 'Method visibility (PHP only)',
        },
        is_static: {
          type: 'boolean',
          description: 'Whether the method is static (PHP only)',
        },
        returnType: {
          type: 'string',
          description: 'Return type (e.g., "int", "string", "void", "object")',
        },
        nullable: {
          type: 'boolean',
          description: 'Whether the return type is nullable',
        },
        parameters: {
          type: 'array',
          description: 'Array of parameter clause UUIDs',
          items: { type: 'string' },
        },
        data: {
          type: 'array',
          description: 'Array of statement UUIDs that form the method body. Use to reorder or remove statements.',
          items: { type: 'string' },
        },
        is_async: {
          type: 'boolean',
          description: 'Whether the method is async (JavaScript/Vue only). Set to true for methods that use await.',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'search_methods',
    description: 'Search for methods in the project by name or within a specific file',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Method name to search for (supports wildcards)',
        },
        file_uuid: {
          type: 'string',
          description: 'Optional: filter results to a specific file',
        },
      },
    },
  },
  {
    name: 'delete_method',
    description: 'Delete a method from a file by UUID. This permanently removes the method and all its code. Requires both the file UUID and method UUID.',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file containing the method (required)',
        },
        uuid: {
          type: 'string',
          description: 'UUID of the method to delete',
        },
      },
      required: ['file', 'uuid'],
    },
  },
  {
    name: 'get_method',
    description: 'Get a method by UUID. Returns the method data including its parameters and body.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the method to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for files in the project by name or type',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'File name pattern to search for',
        },
        type: {
          type: 'string',
          description: 'File type to filter by (class, model, controller, middleware)',
        },
      },
    },
  },
  {
    name: 'create_route',
    description: `Create a route/page. For API routes, you MUST pass BOTH controller AND controller_method UUIDs to wire execution.

IMPORTANT: Both 'controller' (file UUID) and 'controller_method' (method UUID) are required together for API routes to execute code. Without both, the route won't run any code.

Route params like {id} auto-inject into controller method parameters when names match.`,
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the Stellify project',
        },
        name: {
          type: 'string',
          description: 'Route/page name (e.g., "Home", "Counter", "notes.index")',
        },
        path: {
          type: 'string',
          description: 'URL path (e.g., "/", "/counter", "/api/notes")',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
          default: 'GET',
        },
        type: {
          type: 'string',
          enum: ['web', 'api'],
          description: 'Route type: "web" for pages, "api" for API endpoints',
          default: 'web',
        },
        controller: {
          type: 'string',
          description: 'UUID of the controller file. MUST be provided together with controller_method for API routes to execute code.',
        },
        controller_method: {
          type: 'string',
          description: 'UUID of the method to execute. MUST be provided together with controller for API routes to execute code.',
        },
        data: {
          type: 'object',
          description: 'Additional route data (title, description, element UUIDs)',
        },
        module: {
          type: 'string',
          description: 'Optional module name to group this route with related code (e.g., "blog-posts", "user-auth"). Module is auto-created if it doesn\'t exist.',
        },
      },
      required: ['project_id', 'name', 'path', 'method'],
    },
  },
  {
    name: 'get_route',
    description: `Get a route/page by UUID. Returns route details including name, path, and attached elements.

Use this to look up a route you created or to find existing routes in the project.`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'The UUID of the route to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'save_route',
    description: `Update an existing route/page. Use this to wire a route to a controller method.

IMPORTANT: This is how you connect API routes to controller methods!
IMPORTANT: You MUST provide BOTH controller AND controller_method together - they are a pair.

Example - Wire an API route to a controller method:
{
  "uuid": "route-uuid",
  "controller": "controller-file-uuid",
  "controller_method": "method-uuid"
}

Available fields:
- controller: UUID of the controller file (MUST be paired with controller_method)
- controller_method: UUID of the method to execute (MUST be paired with controller)
- path: URL path
- name: Route name
- type: "web" or "api"
- method: HTTP method (GET, POST, PUT, DELETE, PATCH)
- middleware: Array of middleware names
- public: Whether the route is public (no auth required)`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the route to update',
        },
        controller: {
          type: 'string',
          description: 'UUID of the controller file. MUST be provided together with controller_method.',
        },
        controller_method: {
          type: 'string',
          description: 'UUID of the method to execute. MUST be provided together with controller.',
        },
        path: {
          type: 'string',
          description: 'URL path (e.g., "/api/notes")',
        },
        name: {
          type: 'string',
          description: 'Route name',
        },
        type: {
          type: 'string',
          enum: ['web', 'api'],
          description: 'Route type',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
        },
        middleware: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of middleware names',
        },
        public: {
          type: 'boolean',
          description: 'Whether the route is public (no auth required)',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'delete_route',
    description: `Delete a route/page from the project by UUID. This permanently removes the route.

WARNING: This is destructive and cannot be undone. Any elements attached to this route will become orphaned.`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the route to delete',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'search_routes',
    description: `Search for routes/pages in the project by name. Use this to find existing routes before creating new ones.

Returns paginated results with route details including UUID, name, path, and type.
Use the returned UUID with html_to_elements (page parameter) or get_route for full details.`,
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search term to match route names (e.g., "Counter", "Home")',
        },
        type: {
          type: 'string',
          enum: ['web', 'api'],
          description: 'Filter by route type: "web" for pages, "api" for endpoints',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (default: 10)',
        },
      },
    },
  },
  {
    name: 'create_element',
    description: `Create a new UI element on a page (for Elements v2). Provide either page (route UUID) for root elements, or parent (element UUID) for child elements.

Valid element types:
- HTML5: s-wrapper, s-input, s-form, s-svg, s-shape, s-media, s-iframe
- Components: s-loop, s-transition, s-freestyle, s-motion
- Blade: s-directive
- Shadcn/ui: s-chart, s-table, s-combobox, s-accordion, s-calendar, s-contiguous

s-loop ELEMENT TYPE:
Use s-loop for elements that should render with v-for directive.
Required attributes (set via update_element after creation):
- loop: The v-for expression (e.g., "note in notes", "item in items")
- key: The :key binding (e.g., "note.id", "item.id")

Example: After creating s-loop, update it with:
{ "tag": "div", "loop": "note in notes", "key": "note.id", "classes": ["card", "p-4"] }
Generates: <div class="card p-4" v-for="note in notes" :key="note.id">`,
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            's-wrapper', 's-input', 's-form', 's-svg', 's-shape', 's-media', 's-iframe',
            's-loop', 's-transition', 's-freestyle', 's-motion',
            's-directive',
            's-chart', 's-table', 's-combobox', 's-accordion', 's-calendar', 's-contiguous'
          ],
          description: 'Element type - must be one of the valid Stellify element types',
        },
        page: {
          type: 'string',
          description: 'UUID of the page/route to add the element to (for root elements)',
        },
        parent: {
          type: 'string',
          description: 'UUID of the parent element (for child elements)',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'update_element',
    description: `Update a UI element's attributes.

Pass data object with: tag, classes (array), text, variable (for v-model), and event handlers.

Key fields: inputType (not 'type') for button/input HTML type. clickArgs for handler arguments in v-for loops.

EVENT HANDLERS - Use method UUIDs:
{ "click": "method-uuid" } → @click="methodName"
{ "click": "method-uuid", "clickArgs": "item" } → @click="methodName(item)"

Create methods for all handlers, including simple state changes like opening modals or toggling flags.

Event types: click, submit, change, input, focus, blur, keydown, keyup, mouseenter, mouseleave.

EFFICIENCY - Prefer updates over delete/recreate:
- Move between routes: change \`routeParent\` attribute
- Reparent elements: change \`parent\` attribute
- Reorder children: update parent's \`data\` array with new UUID order`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the element to update',
        },
        data: {
          type: 'object',
          description: 'Flat object with HTML attributes and Stellify fields (name, type, locked, tag, classes, text)',
        },
      },
      required: ['uuid', 'data'],
    },
  },
  {
    name: 'get_element',
    description: 'Get a single element by UUID. Returns the element data with all its attributes.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the element to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'get_element_tree',
    description: 'Get an element with all its descendants (children, grandchildren, etc.) as a hierarchical tree structure.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the root element',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'delete_element',
    description: 'Delete an element and all its children (CASCADE). Returns the count of deleted elements.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the element to delete',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'search_elements',
    description: `Search for elements in the project. Useful for finding elements by name, type, or content.

Note: To reorder elements, use update_element to modify the parent element's 'data' array with the new order of child UUIDs.`,
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search query to match against element name, type, or content',
        },
        type: {
          type: 'string',
          description: 'Filter by element type (e.g., s-wrapper, s-input)',
        },
        include_metadata: {
          type: 'boolean',
          description: 'Include additional metadata',
          default: false,
        },
        per_page: {
          type: 'number',
          description: 'Results per page (1-100)',
          default: 20,
        },
      },
    },
  },
  {
    name: 'html_to_elements',
    description: `Convert HTML to Stellify elements. Returns element UUIDs to use in save_file template array.

Auto-detects Vue bindings ({{ var }}). For Vue components, omit 'page'. For pages, provide route UUID.

**@click auto-wiring:** Pass 'file' UUID to auto-resolve @click="methodName" handlers. Methods must exist in the file first.

Prefer SVG icons over emoji (encoding issues).`,
    inputSchema: {
      type: 'object',
      properties: {
        elements: {
          type: 'string',
          description: 'HTML string to convert',
        },
        page: {
          type: 'string',
          description: 'Route UUID to attach elements to. Optional for Vue components.',
        },
        selection: {
          type: 'string',
          description: 'Parent element UUID to attach to (alternative to page)',
        },
        file: {
          type: 'string',
          description: 'Vue component file UUID. Pass this to auto-wire @click handlers to method UUIDs.',
        },
        test: {
          type: 'boolean',
          description: 'If true, returns structure without creating elements',
        },
      },
      required: ['elements'],
    },
  },
  // =============================================================================
  // STATEMENT & FILE MANAGEMENT TOOLS
  // =============================================================================
  {
    name: 'get_statement',
    description: `Get a statement by UUID. Returns the statement data including its clauses (code tokens).`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'The UUID of the statement to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'create_statement',
    description: `Create an empty statement in a file. This is step 1 of 2 - you MUST call add_statement_code next to add the actual code.

**ALTERNATIVE:** Use create_statement_with_code for a single-call approach that combines both steps.

IMPORTANT: This is a TWO-STEP process:
1. create_statement → returns statement UUID
2. add_statement_code → adds the actual code to that statement

Use cases:
- PHP: Class properties, use statements, constants
- JS/Vue: Variable declarations, imports, reactive refs

For Vue components, include the returned statement UUID in save_file's 'statements' array (NOT 'data' - that's for methods).`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file to add the statement to',
        },
        method: {
          type: 'string',
          description: 'UUID of the method to add the statement to (for method body statements)',
        },
      },
    },
  },
  {
    name: 'create_statement_with_code',
    description: `Create a statement with code in a SINGLE call. This combines create_statement and add_statement_code.

**PREFERRED:** Use this instead of the two-step create_statement → add_statement_code process.

**Nested code is handled correctly.** The parser tracks brace/bracket/paren depth and only splits on top-level semicolons. Computed properties, arrow functions with block bodies, and other nested constructs are kept as single statements.

Examples:
- PHP: "use Illuminate\\Http\\Request;" or "private $items = [];"
- JS/Vue: "const count = ref(0);" or "import { ref } from 'vue';"

For Vue components, include the returned statement UUIDs in save_file's 'statements' array (NOT 'data' - that's for methods).`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file to add the statement to',
        },
        code: {
          type: 'string',
          description: 'The code for the statement (e.g., "const count = ref(0);")',
        },
        method: {
          type: 'string',
          description: 'UUID of the method to add the statement to (optional, for method body statements)',
        },
      },
      required: ['file', 'code'],
    },
  },
  {
    name: 'add_statement_code',
    description: `Add code to an existing statement. This is step 2 of 2 - call this AFTER create_statement.

**ALTERNATIVE:** Use create_statement_with_code for a single-call approach that combines both steps.

The statement must already exist (created via create_statement). This parses and stores the code.

Examples:
- PHP: "use Illuminate\\Http\\Request;" or "private $items = [];"
- JS/Vue: "const count = ref(0);" or "import { ref } from 'vue';"`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file containing the statement',
        },
        statement: {
          type: 'string',
          description: 'UUID of the statement to add code to',
        },
        code: {
          type: 'string',
          description: 'The code to add (e.g., "const count = ref(0);")',
        },
      },
      required: ['file', 'statement', 'code'],
    },
  },
  {
    name: 'delete_statement',
    description: 'Delete a statement from a file by UUID. This permanently removes the statement (import, variable, ref, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file containing the statement',
        },
        method: {
          type: 'string',
          description: 'UUID of the method containing the statement (use "file" for file-level statements)',
        },
        uuid: {
          type: 'string',
          description: 'UUID of the statement to delete',
        },
      },
      required: ['file', 'method', 'uuid'],
    },
  },
  {
    name: 'save_statement',
    description: 'Update an existing statement. Use this to modify statement properties after creation.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the statement to update',
        },
        data: {
          type: 'object',
          description: 'Statement data to update',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'save_file',
    description: `Save/update a file with its full configuration. This FINALIZES the file after create_file.

WORKFLOW: create_file creates an empty shell → add methods/statements → save_file wires everything together.

IMPORTANT: This is a full replacement, not a partial update. To update an existing file:
1. Call get_file to fetch current state
2. Modify the returned object
3. Call save_file with the complete object

Required fields: uuid, name, type

IMPORTANT - data vs statements:
- 'data' array = METHOD UUIDs only (functions)
- 'statements' array = STATEMENT UUIDs (imports, variables, refs - code outside methods)

Vue SFC example:
  save_file({
    uuid: fileUuid,
    name: "Counter",
    type: "js",
    extension: "vue",
    template: [rootElementUuid],      // From html_to_elements
    data: [methodUuid],               // Method UUIDs only
    statements: [importStmtUuid, refStmtUuid]  // Statement UUIDs (imports, refs)
  })

For <script setup> content, the order in statements array determines output order.

DEPENDENCY RESOLUTION (includes array):
The 'includes' array accepts BOTH UUIDs and namespace strings.
Namespace strings (e.g., "Illuminate\\Http\\JsonResponse") are automatically resolved to UUIDs.
This works the same as create_file's dependency resolution.`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the file to save',
        },
        name: {
          type: 'string',
          description: 'File name (without extension)',
        },
        type: {
          type: 'string',
          enum: ['js', 'class', 'controller', 'model', 'middleware'],
          description: 'File type: "js" for JavaScript/Vue, others for PHP',
        },
        extension: {
          type: 'string',
          description: 'File extension: "vue" for Vue SFCs, "js" for JavaScript',
        },
        template: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of root element UUIDs for Vue <template> section (from html_to_elements)',
        },
        data: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of METHOD UUIDs only (functions created via create_method)',
        },
        statements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of STATEMENT UUIDs (imports, variables, refs - created via create_statement)',
        },
        includes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file UUIDs OR namespace strings for FRAMEWORK classes only (Request, JsonResponse, etc.). Do NOT put project models here - use the models array instead.',
        },
        models: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of model file UUIDs for PROJECT models (Feedback, Vote, etc.). These get sandbox namespace automatically. Do NOT also add these to includes or you will get duplicate use statement errors.',
        },
      },
      required: ['uuid', 'name', 'type'],
    },
  },
  {
    name: 'get_file',
    description: 'Get a file by UUID with all its metadata, methods, and statements.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the file to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'delete_file',
    description: `Delete a file from the project by UUID. This permanently removes the file and all its methods/statements.

WARNING: This is destructive and cannot be undone. Make sure the file is not referenced elsewhere before deleting.`,
    inputSchema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'UUID of the directory containing the file (get from get_project directories array or get_file response)',
        },
        uuid: {
          type: 'string',
          description: 'UUID of the file to delete',
        },
      },
      required: ['directory', 'uuid'],
    },
  },
  {
    name: 'get_directory',
    description: `Get a directory by UUID to see its contents.

Use this to inspect directories returned by get_project. The project's data array contains directory UUIDs.
Returns the directory name and list of files/subdirectories inside it.`,
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'The UUID of the directory to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'create_directory',
    description: `Create a new directory for organizing files.

Common directories:
- 'js' for JavaScript/Vue files
- 'css' for stylesheets
- 'components' for reusable components

IMPORTANT: Check existing directories first using get_project and get_directory before creating new ones.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Directory name (e.g., "js", "css", "components")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'save_directory',
    description: 'Update an existing directory. Use this to rename or modify directory properties.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the directory to update',
        },
        name: {
          type: 'string',
          description: 'New directory name',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'broadcast_element_command',
    description: `Push real-time UI updates via WebSocket. Use for SHOW/DISPLAY/DEMONSTRATE requests.

Actions: update (modify element), create (ephemeral element), batch (multiple updates), delete.

Changes are EPHEMERAL (not saved). For persistent changes, use update_element or html_to_elements.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['update', 'batch', 'delete', 'create'],
          description: 'The type of command to broadcast',
        },
        element: {
          type: 'string',
          description: 'UUID of the element to modify (required for update, delete, create)',
        },
        changes: {
          type: 'object',
          description: 'Object containing attribute changes (e.g., { classes: ["bg-blue-500"], text: "Hello" })',
        },
        updates: {
          type: 'array',
          description: 'Array of updates for batch action: [{ element: "uuid", changes: {...} }]',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              changes: { type: 'object' },
            },
            required: ['element', 'changes'],
          },
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'create_resources',
    description: `Scaffold Model, Controller, Service, and Migration in ONE operation.

Creates: Model ($fillable, $casts, relationships), Controller (CRUD actions), Service (optional), Migration.

IMPORTANT: Routes are NOT auto-wired. After creation, use create_route with the returned controller UUID and method UUIDs.

IMPORTANT: After creation, check the controller methods for return types and parameter types. If methods use classes not already in includes (e.g., JsonResponse), add those class UUIDs to the controller's includes via save_file.

Response includes controller.methods array with {uuid, name} for each action (index, store, update, destroy).`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Resource name in PascalCase (e.g., "User", "BlogPost", "OrderItem")',
        },
        fields: {
          type: 'array',
          description: 'Array of field definitions for the model and migration',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Field name in snake_case (e.g., "first_name", "is_active")',
              },
              type: {
                type: 'string',
                enum: ['string', 'integer', 'int', 'bigint', 'boolean', 'bool', 'float', 'double', 'decimal', 'date', 'datetime', 'timestamp', 'text', 'longtext', 'json', 'email'],
                description: 'Field data type',
              },
              nullable: {
                type: 'boolean',
                description: 'Allow NULL values (default: false)',
              },
              unique: {
                type: 'boolean',
                description: 'Add unique constraint (default: false)',
              },
              required: {
                type: 'boolean',
                description: 'Require in validation for store action (default: true)',
              },
              default: {
                description: 'Default value for the field',
              },
              max: {
                type: 'integer',
                description: 'Maximum length/value for validation',
              },
            },
            required: ['name'],
          },
        },
        relationships: {
          type: 'array',
          description: 'Array of relationship definitions',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'],
                description: 'Relationship type',
              },
              model: {
                type: 'string',
                description: 'Related model name in PascalCase',
              },
              name: {
                type: 'string',
                description: 'Custom method name (defaults to camelCase of model)',
              },
            },
            required: ['type', 'model'],
          },
        },
        controller: {
          type: 'boolean',
          description: 'Create controller with CRUD actions (default: true)',
        },
        service: {
          type: 'boolean',
          description: 'Create service class for business logic (default: false)',
        },
        migration: {
          type: 'boolean',
          description: 'Create database migration (default: true)',
        },
        routes: {
          type: 'boolean',
          description: 'Create API routes (default: true)',
        },
        soft_deletes: {
          type: 'boolean',
          description: 'Add soft delete support to model and migration (default: false)',
        },
        api: {
          type: 'boolean',
          description: 'Generate API-style responses (default: true)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'run_code',
    description: `Execute a method in the Stellify project environment and return the output.

This tool allows you to run methods you've created and see the results. Use this for:
- Testing methods you've created
- Verifying code behavior
- Debugging issues
- Getting real feedback on code execution

REQUIRED: Both file and method UUIDs must be provided.

EXAMPLES:

Run a method:
{
  "file": "file-uuid",
  "method": "method-uuid",
  "args": []
}

Run with benchmarking enabled:
{
  "file": "file-uuid",
  "method": "method-uuid",
  "benchmark": true
}

RESPONSE includes:
- output: The return value or printed output
- success: Whether execution succeeded
- error: Error message if failed
- execution_time: Time taken (if benchmark enabled)
- memory_usage: Memory used (if benchmark enabled)

SECURITY: Code runs in a sandboxed environment with limited permissions.`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'UUID of the file containing the method to run (required)',
        },
        method: {
          type: 'string',
          description: 'UUID of the method to execute (required)',
        },
        args: {
          type: 'array',
          description: 'Arguments to pass to the method',
          items: {},
        },
        timeout: {
          type: 'number',
          description: 'Execution timeout in seconds (default: 30, max: 60)',
        },
        benchmark: {
          type: 'boolean',
          description: 'Enable benchmarking to measure execution time and memory usage',
        },
      },
      required: ['file', 'method'],
    },
  },
  {
    name: 'request_capability',
    description: `Log a missing system-level capability request.

Use this when you encounter a user requirement that needs framework-level functionality
that doesn't exist in Stellify. This creates a ticket in the Stellify backlog.

DO NOT try to build system capabilities yourself - log them here instead.

Examples of capability requests:
- "Need WebSocket support for real-time chat"
- "Need S3 file upload with signed URLs"
- "Need scheduled task runner for daily reports"
- "Need OAuth2 social login (Google, GitHub)"`,
    inputSchema: {
      type: 'object',
      properties: {
        capability: {
          type: 'string',
          description: 'Short name for the capability (e.g., "websocket-support", "s3-uploads", "social-oauth")',
        },
        description: {
          type: 'string',
          description: 'Detailed description of what capability is needed',
        },
        use_case: {
          type: 'string',
          description: 'The user requirement that triggered this request',
        },
        workaround: {
          type: 'string',
          description: 'Any temporary workaround, or "blocked" if none exists',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Suggested priority based on user need (default: medium)',
        },
      },
      required: ['capability', 'description', 'use_case'],
    },
  },
  {
    name: 'analyze_performance',
    description: `Analyze code execution performance from logs. Identifies slow methods, N+1 query patterns, high memory usage, and failure rates.

Use this tool PROACTIVELY to:
- Review performance after creating new methods
- Identify optimization opportunities
- Detect N+1 query patterns (high query counts)
- Find methods that need caching or refactoring
- Check failure rates and error patterns

ANALYSIS TYPES:
- full: Comprehensive report with all issues, recommendations, and statistics
- slow_methods: Methods exceeding 500ms execution time
- high_query_methods: Methods with >10 queries (potential N+1 problems)
- high_memory_methods: Methods using >50MB memory
- failure_rates: Methods with high error rates
- trend: Performance trend over time (daily averages)

EXAMPLE - Full analysis:
{ "type": "full", "days": 7 }

EXAMPLE - Check for N+1 queries:
{ "type": "high_query_methods", "limit": 10 }

The response includes actionable recommendations like:
- "Consider eager loading relationships" for N+1 patterns
- "Add database indexes" for slow queries
- "Use chunking" for high memory usage`,
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['full', 'slow_methods', 'high_query_methods', 'high_memory_methods', 'failure_rates', 'trend'],
          description: 'Type of analysis to run (default: full)',
        },
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 7)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results for specific queries (default: 10)',
        },
      },
    },
  },
  {
    name: 'analyze_quality',
    description: `Analyze Laravel code structure for quality issues. Detects missing relationships, fillables, casts, and route problems.

Use this tool PROACTIVELY to:
- Review code quality after creating models or controllers
- Detect missing Eloquent relationships (belongsTo, hasMany)
- Find migration fields not in $fillable
- Suggest type casts for columns (json → array, datetime → datetime)
- Identify broken route bindings (orphaned methods, missing controllers)

ANALYSIS TYPES:
- full: Comprehensive analysis of all categories with recommendations
- relationships: Missing belongsTo/hasMany based on foreign keys
- fillables: Migration fields not in Model $fillable array
- casts: Columns that should have type casts
- routes: Orphaned controller methods, routes pointing to missing methods

EXAMPLE - Full analysis:
{ "type": "full" }

EXAMPLE - Check relationships only:
{ "type": "relationships" }

The response includes actionable suggestions like:
- "Add belongsTo relationship: public function user() { return $this->belongsTo(User::class); }"
- "Add 'published_at' to $fillable array"
- "Add cast: 'metadata' => 'array'"`,
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['full', 'relationships', 'fillables', 'casts', 'routes'],
          description: 'Type of analysis to run (default: full)',
        },
      },
    },
  },
  {
    name: 'get_setting',
    description: `Get a setting/config value from the tenant's settings table.

These settings are read by the config() function in sandbox code execution.
Use this to check existing configuration values before modifying them.

EXAMPLE:
{ "name": "app" }

Returns the setting data as key-value pairs, e.g.:
{
  "name": "My App",
  "timezone": "UTC",
  "locale": "en"
}

Common setting profiles:
- "app": Application settings (name, timezone, locale)
- "database": Database connection settings
- "mail": Mail configuration
- "cache": Cache settings
- Custom profiles for app-specific config`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Setting profile name (e.g., "app", "database", "mail", or custom names like "vote")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'save_setting',
    description: `Create or update a setting in the tenant's settings table.

These settings are accessible via config() in sandbox code execution.
Use this to configure application behavior, API keys, feature flags, etc.

IMPORTANT: This creates or updates the setting profile with the provided key-value data.
The data is merged with any existing values for that profile.

EXAMPLE - Create app settings:
{
  "name": "app",
  "data": {
    "name": "My Feedback App",
    "timezone": "America/New_York",
    "locale": "en"
  }
}

EXAMPLE - Create custom settings for voting:
{
  "name": "vote",
  "data": {
    "salt": "my-secret-salt-for-ip-hashing",
    "allow_anonymous": true,
    "max_votes_per_day": 10
  }
}

In your controller code, access these with:
- config('app.name') returns "My Feedback App"
- config('vote.salt') returns "my-secret-salt-for-ip-hashing"
- config('vote.allow_anonymous') returns true`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Setting profile name (e.g., "app", "vote", "features")',
        },
        data: {
          type: 'object',
          description: 'Key-value pairs for the setting (e.g., { "salt": "secret", "enabled": true })',
        },
      },
      required: ['name', 'data'],
    },
  },
  {
    name: 'delete_setting',
    description: `Delete a setting profile from the tenant's settings table.

WARNING: This permanently removes the entire setting profile and all its values.
This cannot be undone.

EXAMPLE:
{ "name": "vote" }

This removes the "vote" setting profile entirely.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Setting profile name to delete',
        },
      },
      required: ['name'],
    },
  },
];

// Server instructions for tool discovery (used by MCP Tool Search)
const SERVER_INSTRUCTIONS = `Stellify is a coding platform where you code alongside AI on a codebase maintained and curated by AI. Build Laravel, stellify-framework, and Vue.js applications.

Use Stellify tools when:
- Building PHP controllers, models, middleware, or classes
- Creating Vue.js components with reactive state and UI
- Managing UI elements (HTML stored as structured JSON)
- Working with a Stellify project (user will mention "Stellify" or provide project UUID)

Key concepts:
- Code is stored as structured JSON, enabling surgical AI edits at the statement level
- Files contain methods and statements (code outside methods)
- Vue components link to UI elements via the 'template' field
- Event handlers (click, submit) wire UI elements to methods by UUID

## General Workflow (all file types)

1. create_file → empty shell, returns file UUID
2. create_method → signature only, returns method UUID
3. add_method_body → implementation code
4. create_statement + add_statement_code → for imports, variables, refs
5. save_file → finalize with template/data/statements arrays

## Vue Component Workflow

1. get_project → find 'js' directory UUID (or create it)
2. create_file → type='js', extension='vue' for the component
   - **Auto-creates app.js** and **template route** (check response for appJs and templateRoute fields)
3. Create statements for imports using **create_statement_with_code** (ONE call each):
   - create_statement_with_code(file, "import { ref, onMounted } from 'vue';")
   - create_statement_with_code(file, "import { Http } from 'stellify-framework';")
4. Create statements for reactive data: create_statement_with_code(file, "const notes = ref([]);")
5. **create_method with body** (async auto-detected from \`await\`). Example:
   \`\`\`
   create_method({
     file: fileUuid,
     name: "fetchNotes",
     body: "const response = await Http.get('/api/notes');\\nnotes.value = response.data || [];"
   })
   \`\`\`
6. Create statement for onMounted: create_statement_with_code(file, "onMounted(fetchData);")
7. **Create UI interaction methods** for any button that changes state:
   \`\`\`
   create_method({ file: fileUuid, name: "openModal", body: "showModal.value = true;" })
   create_method({ file: fileUuid, name: "closeModal", body: "showModal.value = false;" })
   \`\`\`
8. html_to_elements with @click handlers auto-wired:
   \`\`\`
   html_to_elements({
     elements: '<button @click="openModal">Open</button>',
     page: templateRoute.uuid,
     file: fileUuid  // Auto-wires @click="openModal" to the method UUID
   })
   \`\`\`
9. save_file with: extension='vue', template=[elementUuid], data=[methodUuids], statements=[importUuids, refUuids, onMountedUuid]
11. Create web route for the display page (e.g., "/notes")
12. Add \`<div id="app"></div>\` to the display page: html_to_elements(page=routeUuid, elements='<div id="app"></div>')

## Fetching Paginated Data

Use \`Http.items()\` for paginated endpoints - it auto-extracts the array from Laravel responses:

\`\`\`javascript
// Recommended - auto-extracts .data from paginated response
notes.value = await Http.items('/api/notes');

// Alternative - manual extraction
const response = await Http.get('/api/notes');
notes.value = response.data || [];
\`\`\`

## Editing Existing Code

- **Edit at the right level:** To change code, edit the statement or clause - never delete an entire method just to change a line.

## Common Pitfalls

- **@click auto-wiring:** Pass the file UUID to html_to_elements to auto-wire @click handlers. Methods must be created BEFORE calling html_to_elements.
- **Stellify imports:** Use "stellify-framework" package (NOT @stellify/core)
  CORRECT: import { Http, List, Form } from 'stellify-framework';
  WRONG: import { Http } from '@stellify/core';
- v-model requires ref(), NOT Form class: const formData = ref({title: ''})
- List is iterable and works directly with v-for (no .toArray() needed)
- add_method_body APPENDS, doesn't replace - create new method to replace
- 'data' array = method UUIDs, 'statements' array = import/variable UUIDs
- For buttons in forms, set inputType: "button" to prevent auto-submit
- **Async methods:** Auto-detected when body contains \`await\`. Response includes \`is_async: true\` if detected.
- **onMounted:** Use direct method reference: "onMounted(fetchNotes);"
  The assembler automatically outputs lifecycle hooks after method definitions.

## Nullable Refs: Use explicit v-if, NOT v-else

When using nullable refs (e.g., \`const editingItem = ref(null)\`) with v-model, use explicit v-if guards:
- WRONG: \`<template v-else><input v-model="editingItem.title"/></template>\`
- CORRECT: \`<template v-if="editingItem && editingItem.id === item.id"><input v-model="editingItem.title"/></template>\`

Vue evaluates v-model bindings before v-else is applied, causing "Cannot read properties of null" errors.

## Stack and Business Logic

**Default stack:** Laravel (PHP), stellify-framework (JS), and Vue.js. Available capabilities (optional packages/libraries) are returned by \`get_project\`. Use \`get_stellify_framework_api\` for the stellify-framework API reference.

**All business logic** (controllers, models, middleware, etc.) goes in the tenant DB via MCP tools. If a required capability is not available, use \`request_capability\` to log it.

**Prefer Laravel methods:** When Laravel provides a helper (Str, Arr, Hash, Number, Collection), use it instead of native PHP functions.

## JavaScript Entry File (app.js) - Auto-Generated

When you create a Vue component, **app.js is automatically created/updated** with component registration. The create_file response will confirm this with an \`appJs\` field.

**Page mount point:** Each page using Vue needs \`<div id="app"></div>\`:
- html_to_elements(page=routeUuid, elements='<div id="app"></div>')`;

// Create MCP server
const server = new Server(
  {
    name: 'stellify-mcp',
    version: '0.1.28',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions: SERVER_INSTRUCTIONS,
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    switch (name) {
      case 'get_stellify_framework_api': {
        const moduleName = args.module as string | undefined;
        let result: any;

        if (moduleName) {
          const moduleApi = (STELLIFY_FRAMEWORK_API as any)[moduleName];
          if (moduleApi) {
            result = { [moduleName]: moduleApi };
          } else {
            result = { error: `Module "${moduleName}" not found. Available: ${Object.keys(STELLIFY_FRAMEWORK_API).join(', ')}` };
          }
        } else {
          result = STELLIFY_FRAMEWORK_API;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_project': {
        const result = await stellify.getProject();
        const projectData = result.data || result;
        const projectMeta = projectData.project || {};
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Active project: "${projectMeta.name || 'unknown'}" (${projectMeta.uuid || 'unknown'})`,
                project: projectData,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_file': {
        const result = await stellify.createFile(args as any);
        const fileData = result.data || result;
        const appJs = fileData.appJs || result.appJs;

        let message = `Created file "${(args as any).name}" (UUID: ${fileData.uuid})`;
        if (appJs?.created) {
          message += `. Auto-created app.js (UUID: ${appJs.uuid}) with component registration.`;
        } else if (appJs?.updated) {
          message += `. Auto-updated app.js to include this component.`;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message,
                file: fileData,
                appJs: appJs || null,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_method': {
        const result = await stellify.createMethod(args as any);
        const methodData = result.data || result;
        const hasBody = !!(args as any).body;

        const response: any = {
          success: true,
          message: hasBody
            ? `Created method "${(args as any).name}" with body (UUID: ${methodData.uuid})`
            : `Created method "${(args as any).name}" (UUID: ${methodData.uuid})`,
          method: methodData,
        };

        // Include statements and clauses if body was provided
        if (result.statements) {
          response.statements = result.statements;
        }
        if (result.clauses) {
          response.clauses = result.clauses;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'save_method': {
        const { uuid, ...data } = args as any;
        const result = await stellify.saveMethod(uuid, { uuid, ...data });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Updated method "${uuid}"`,
                method: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'add_method_body': {
        const result = await stellify.addMethodBody(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Method body parsed and saved successfully',
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_methods': {
        const result = await stellify.searchMethods(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                results: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_method': {
        const { file, uuid } = args as { file: string; uuid: string };
        const result = await stellify.deleteMethod(file, uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted method ${uuid} from file ${file}`,
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_method': {
        const { uuid } = args as { uuid: string };
        const result = await stellify.getMethod(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                method: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_files': {
        const result = await stellify.searchFiles(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                results: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_route': {
        const result = await stellify.createRoute(args as any);
        const routeData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created route "${(args as any).name}" at ${(args as any).path} (UUID: ${routeData.uuid}). Use this UUID for html_to_elements page parameter.`,
                route: routeData,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_route': {
        const result = await stellify.getRoute((args as any).uuid);
        const routeData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Route: "${routeData.name}" at ${routeData.path}`,
                route: routeData,
              }, null, 2),
            },
          ],
        };
      }

      case 'save_route': {
        const { uuid, ...updateData } = args as any;
        const result = await stellify.saveRoute(uuid, updateData);
        const routeData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Updated route "${uuid}"${updateData.controller ? ' with controller wiring' : ''}`,
                route: routeData,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_route': {
        const { uuid } = args as { uuid: string };
        const result = await stellify.deleteRoute(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted route ${uuid}`,
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_routes': {
        const result = await stellify.searchRoutes(args as any);
        const routes = result.data || result;
        // Handle paginated response - data.data contains the actual routes array
        const routeData = routes.data || routes;
        const routeCount = Array.isArray(routeData) ? routeData.length : routes.total || 0;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Found ${routeCount} routes`,
                routes: routes,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_element': {
        const result = await stellify.createElement(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created element of type "${(args as any).type}"`,
                element: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'update_element': {
        const { uuid, data } = args as any;
        const result = await stellify.updateElement(uuid, data);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Updated element ${uuid}`,
                element: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_element': {
        const { uuid } = args as any;
        const result = await stellify.getElement(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                element: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_element_tree': {
        const { uuid } = args as any;
        const result = await stellify.getElementTree(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Retrieved element tree for ${uuid}`,
                tree: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_element': {
        const { uuid } = args as any;
        const result = await stellify.deleteElement(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted element ${uuid} and ${result.deleted_count} total elements`,
                deleted_count: result.deleted_count,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_elements': {
        const result = await stellify.searchElements(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Found ${result.data.length} elements`,
                elements: result.data,
                pagination: result.pagination,
              }, null, 2),
            },
          ],
        };
      }

      case 'html_to_elements': {
        const result = await stellify.htmlToElements(args as any);
        const elementCount = Object.keys(result.data || {}).length;
        const testMode = (args as any).test ? ' (TEST MODE - not created)' : '';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Converted HTML to ${elementCount} elements${testMode}`,
                elements: result.data,
              }, null, 2),
            },
          ],
        };
      }

      // Statement & File Management handlers
      case 'get_statement': {
        const result = await stellify.getStatement((args as any).uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Statement retrieved`,
                statement: result.statement || result,
                clauses: result.clauses || null,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_statement': {
        const result = await stellify.createStatement(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created statement (${result.data?.uuid || result.uuid})`,
                statement: result.data || result,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_statement_with_code': {
        const result = await stellify.createStatementWithCode(args as any);
        const statementData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created statement with code (UUID: ${statementData.uuid})`,
                statement: statementData.statement || statementData,
                statements: statementData.statements,
                clauses: statementData.clauses,
              }, null, 2),
            },
          ],
        };
      }

      case 'add_statement_code': {
        const result = await stellify.addStatementCode(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Statement code added successfully',
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_statement': {
        const { file, method, uuid } = args as { file: string; method: string; uuid: string };
        const result = await stellify.deleteStatement(file, method, uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted statement ${uuid}`,
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'save_statement': {
        const { uuid, ...data } = args as any;
        const result = await stellify.saveStatement(uuid, { uuid, ...data });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Saved statement ${uuid}`,
                statement: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'save_file': {
        const { uuid, ...data } = args as any;
        const result = await stellify.saveFile(uuid, { uuid, ...data });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Saved file "${data.name || uuid}"`,
                file: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_file': {
        const { uuid } = args as any;
        const result = await stellify.getFile(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                file: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_file': {
        const { directory, uuid } = args as { directory: string; uuid: string };
        const result = await stellify.deleteFile(directory, uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted file ${uuid} from directory ${directory}`,
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_directory': {
        const result = await stellify.getDirectory((args as any).uuid);
        const dirData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Directory: "${dirData.name}" (${dirData.uuid})`,
                directory: dirData,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_directory': {
        const result = await stellify.createDirectory(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: result.existing
                  ? `Using existing directory "${(args as any).name}" (${result.data?.uuid || result.uuid})`
                  : `Created directory "${(args as any).name}" (${result.data?.uuid || result.uuid})`,
                directory: result.data || result,
                existing: result.existing || false,
              }, null, 2),
            },
          ],
        };
      }

      case 'save_directory': {
        const { uuid, ...data } = args as any;
        const result = await stellify.saveDirectory(uuid, data);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Saved directory ${uuid}`,
                directory: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'broadcast_element_command': {
        const result = await stellify.broadcastElementCommand(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Broadcast ${(args as any).action} command${(args as any).element ? ` for element ${(args as any).element}` : ''}`,
                data: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_resources': {
        const result = await stellify.createResources(args as any);
        const data = result.data || result;
        const stats = data.statistics || {};

        // Build summary of what was created
        const created = [];
        if (data.model) created.push(`Model (${data.model.uuid})`);
        if (data.controller) created.push(`Controller (${data.controller.uuid})`);
        if (data.service) created.push(`Service (${data.service.uuid})`);
        if (data.migration) created.push(`Migration (${data.migration.uuid})`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created ${(args as any).name} resource: ${created.join(', ')} (${stats.files || 0} files, ${stats.methods || 0} methods)`,
                data: {
                  name: data.name,
                  model: data.model ? {
                    uuid: data.model.uuid,
                    name: data.model.name,
                    namespace: data.model.namespace,
                    methods: data.model.methods,
                  } : null,
                  controller: data.controller ? {
                    uuid: data.controller.uuid,
                    name: data.controller.name,
                    namespace: data.controller.namespace,
                    methods: data.controller.methods,
                  } : null,
                  service: data.service ? {
                    uuid: data.service.uuid,
                    name: data.service.name,
                    namespace: data.service.namespace,
                    methods: data.service.methods,
                  } : null,
                  migration: data.migration ? {
                    uuid: data.migration.uuid,
                    name: data.migration.name,
                    table: data.migration.table,
                  } : null,
                  statistics: stats,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'run_code': {
        const result = await stellify.runCode(args as any);
        const benchmarkInfo = (args as any).benchmark
          ? ` (${result.execution_time || 'N/A'}ms, ${result.memory_usage || 'N/A'})`
          : '';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success !== false,
                message: result.success !== false
                  ? `Code executed successfully${benchmarkInfo}`
                  : `Execution failed: ${result.error || 'Unknown error'}`,
                output: result.output,
                error: result.error,
                execution_time: result.execution_time,
                memory_usage: result.memory_usage,
              }, null, 2),
            },
          ],
        };
      }

      case 'request_capability': {
        const result = await stellify.requestCapability(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Capability request logged: "${(args as any).capability}"`,
                request_id: result.data?.uuid || result.uuid,
                data: result.data || result,
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_performance': {
        const result = await stellify.analyzePerformance(args as any);
        const data = result.data || result;
        const analysisType = (args as any).type || 'full';

        // Build message based on analysis type
        let message = '';
        if (analysisType === 'full') {
          message = data.summary || `Analyzed ${data.analyzed_executions || 0} executions`;
          if (data.issues?.length > 0) {
            message += ` - Found ${data.issues.length} potential issue(s)`;
          }
        } else if (analysisType === 'slow_methods') {
          const methods = data.slow_methods || data;
          message = `Found ${Array.isArray(methods) ? methods.length : 0} slow methods`;
        } else if (analysisType === 'high_query_methods') {
          const methods = data.high_query_methods || data;
          message = `Found ${Array.isArray(methods) ? methods.length : 0} methods with high query counts (potential N+1)`;
        } else if (analysisType === 'high_memory_methods') {
          const methods = data.high_memory_methods || data;
          message = `Found ${Array.isArray(methods) ? methods.length : 0} methods with high memory usage`;
        } else if (analysisType === 'failure_rates') {
          const methods = data.failure_rates || data;
          message = `Found ${Array.isArray(methods) ? methods.length : 0} methods with failures`;
        } else if (analysisType === 'trend') {
          const trend = data.trend || data;
          message = `Performance trend: ${Array.isArray(trend) ? trend.length : 0} days of data`;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message,
                analysis_type: analysisType,
                data,
              }, null, 2),
            },
          ],
        };
      }

      case 'analyze_quality': {
        const result = await stellify.analyzeQuality(args as any);
        const data = result.data || result;
        const analysisType = (args as any).type || 'full';

        // Build message based on analysis type
        let message = '';
        const issues = data.issues || [];

        if (analysisType === 'full') {
          const summary = data.summary || {};
          message = `Analyzed ${summary.models_analyzed || 0} models, ${summary.controllers_analyzed || 0} controllers`;
          if (summary.total_issues > 0) {
            message += ` - Found ${summary.total_issues} issue(s): ${summary.high_severity || 0} high, ${summary.medium_severity || 0} medium, ${summary.low_severity || 0} low`;
          } else {
            message += ' - No issues found';
          }
        } else {
          message = `Found ${issues.length} ${analysisType} issue(s)`;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message,
                analysis_type: analysisType,
                data,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_setting': {
        const result = await stellify.getSetting((args as any).name);
        const data = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Retrieved setting "${(args as any).name}"`,
                setting: data,
              }, null, 2),
            },
          ],
        };
      }

      case 'save_setting': {
        const { name, data } = args as { name: string; data: Record<string, any> };
        await stellify.saveSetting(name, data);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Saved setting "${name}" with ${Object.keys(data).length} key(s)`,
                keys: Object.keys(data),
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_setting': {
        await stellify.deleteSetting((args as any).name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted setting "${(args as any).name}"`,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data || error.toString(),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stellify MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

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

// =============================================================================
// STELLIFY AI WORKFLOW GUIDE
// =============================================================================
// Stellify stores code as structured JSON, not text files.
// This enables surgical AI edits at the statement level.
//
// SUPPORTED FILE TYPES:
// - PHP: Controllers, Models, Middleware, Classes
// - JavaScript/TypeScript: JS files, Vue SFCs
// - UI: Elements (HTML structure stored as JSON)
//
// -----------------------------------------------------------------------------
// GENERAL WORKFLOW (applies to all file types)
// -----------------------------------------------------------------------------
// 1. Create file skeleton (create_file) - empty structure, no methods yet
// 2. Add methods (create_method) - creates signature only
// 3. Add method bodies (add_method_body) - implementation code
// 4. Add statements (create_statement + add_statement_code) - for non-method code
// 5. Save file (save_file) - finalize with all references
//
// -----------------------------------------------------------------------------
// PHP EXAMPLE: Creating a Controller
// -----------------------------------------------------------------------------
// 1. create_file: type='controller', name='UserController'
// 2. create_method: name='store', parameters=[{name:'request', type:'Request'}]
// 3. add_method_body: code='return response()->json($request->all());'
//
// -----------------------------------------------------------------------------
// VUE COMPONENT WORKFLOW (step-by-step)
// -----------------------------------------------------------------------------
// Vue components combine UI elements with reactive data. Follow this order:
//
// 1. get_project - Find the 'js' directory UUID
// 2. create_file - type='js', extension='vue' in js directory
// 3. Create statements for IMPORTS and DATA (each needs create_statement + add_statement_code):
//    - "import { ref } from 'vue';"  ← REQUIRED for using ref()
//    - "const count = ref(0);"
//    NOTE: Vue imports are NOT auto-generated. You must add them manually.
// 4. create_method - Creates method signature (returns UUID)
//    add_method_body - Add implementation: "count.value++;"
// 5. html_to_elements - Convert template HTML to elements (no 'page' needed)
//    NOTE: Vue bindings like {{ count }} auto-create statements linked to elements
// 6. update_element - Wire event handlers (e.g., click → method UUID)
// 7. save_file - Finalize with:
//    - extension: 'vue'
//    - template: [rootElementUuid] (from html_to_elements)
//    - data: [methodUuid] (METHOD UUIDs only!)
//    - statements: [importStmtUuid, countStmtUuid] (STATEMENT UUIDs - imports, refs)
//
// Vue SFC file structure:
//   - extension: 'vue'
//   - template: Array of root element UUIDs (<template> section)
//   - data: Array of METHOD UUIDs only (<script setup> functions)
//   - statements: Array of STATEMENT UUIDs (<script setup> imports, variables, refs)
//   - includes: Array of file UUIDs to import
//
// -----------------------------------------------------------------------------
// ELEMENT EVENT HANDLERS (for frontend files)
// -----------------------------------------------------------------------------
// Elements can have these event properties (value is method UUID):
//   - click: Fires on click (@click)
//   - submit: Fires on form submit (@submit)
//   - change: Fires on input change (@change)
//   - input: Fires on input in real-time (@input)
//   - focus: Fires when element receives focus (@focus)
//   - blur: Fires when element loses focus (@blur)
//   - keydown: Fires on key press (@keydown)
//   - keyup: Fires on key release (@keyup)
//   - mouseenter: Fires on mouse enter (@mouseenter)
//   - mouseleave: Fires on mouse leave (@mouseleave)
//
// =============================================================================

// Define MCP tools
const tools: Tool[] = [
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
2. create_statement + add_statement_code → add variables/imports (returns statement UUIDs)
3. create_method + add_method_body → add functions (returns method UUIDs)
4. html_to_elements → create template elements (returns element UUIDs)
5. save_file → FINALIZE by wiring template/data arrays with all collected UUIDs

For PHP: Use type='class', 'model', 'controller', or 'middleware'.
For Vue: Use type='js' and extension='vue'. Place in the 'js' directory.

DEPENDENCY RESOLUTION (automatic):
Pass 'includes' as an array of namespace strings (e.g., ["App\\Models\\User", "Illuminate\\Support\\Facades\\Hash"]).
The system resolves these to UUIDs automatically, creating missing dependencies on-demand:
- App\\* classes → creates stub file in your project (tenant DB)
- Illuminate\\*/Laravel\\* → fetches from Laravel API, creates in Application DB
- Vendor packages → fetches from vendor, creates in Application DB`,
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
      },
      required: ['directory', 'name', 'type'],
    },
  },
  {
    name: 'create_method',
    description: `Create a method signature in a file. This only creates the method declaration, not the body. Use add_method_body to add implementation.

Parameters are automatically created as clauses. The response includes the clause UUIDs for each parameter.

Example request:
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

Example response includes:
{
  "uuid": "method-uuid",
  "name": "verify",
  "returnType": "object",
  "nullable": true,
  "parameters": ["clause-uuid-for-credentials"],
  ...
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
      },
      required: ['file', 'name'],
    },
  },
  {
    name: 'add_method_body',
    description: 'Parse and add PHP code to a method body. Provide the method implementation code (without the function declaration). Stellify will parse it into structured statements.',
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
    description: `Update an existing method's properties (name, visibility, returnType, nullable, parameters).

Use this to modify a method after creation. For updating the method body, use add_method_body instead.

Example:
{
  "uuid": "method-uuid",
  "returnType": "object",
  "nullable": true
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
    name: 'search_files',
    description: 'Search for files in the project by name or type',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
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
    description: 'Create a new route/page in a Stellify project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the Stellify project',
        },
        name: {
          type: 'string',
          description: 'Route/page name (e.g., "Home", "Counter", "About")',
        },
        path: {
          type: 'string',
          description: 'URL path (e.g., "/", "/counter", "/about")',
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
        data: {
          type: 'object',
          description: 'Additional route data (title, description, element UUIDs)',
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
- Shadcn/ui: s-chart, s-table, s-combobox, s-accordion, s-calendar, s-contiguous`,
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
    description: `Update an existing UI element (for Elements v2).

Use standard HTML attributes directly (placeholder, href, src, type, etc.).

Special Stellify fields:
- name: Element name in editor
- type: Element type (s-wrapper, s-input, etc.)
- locked: Prevent editing (boolean)
- tag: HTML tag (div, input, button, etc.)
- classes: CSS classes array ["class1", "class2"]
- text: Element text content

EVENT HANDLERS (set value to method UUID):
- click: @click - buttons, links, any clickable element
- submit: @submit - form submission
- change: @change - input/select value changed (on blur)
- input: @input - input value changing (real-time, as user types)
- focus: @focus - element receives focus
- blur: @blur - element loses focus
- keydown: @keydown - key pressed down
- keyup: @keyup - key released
- mouseenter: @mouseenter - mouse enters element
- mouseleave: @mouseleave - mouse leaves element

Example wiring a button click to a method:
{
  "uuid": "button-element-uuid",
  "data": {
    "click": "increment-method-uuid"
  }
}`,
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
    description: `Convert HTML to Stellify elements in ONE operation. This is the FASTEST way to build interfaces!

This will:
1. Parse the HTML structure
2. Create all elements with proper nesting and types
3. Preserve all attributes, classes, text content
4. Auto-detect Vue bindings ({{ variable }}) and create linked statements
5. Return element UUIDs to use in save_file template array

Element type mapping:
- button, input, textarea, select → s-input
- div, span, p, section, etc. → s-wrapper
- form → s-form
- img, video, audio → s-media

VUE BINDING AUTO-DETECTION:
Text like {{ count }} is automatically detected and:
- A statement is created with the binding code
- The statement UUID is added to the element's 'statements' array
- You still need to create the reactive data source separately (const count = ref(0))

For Vue components: Omit 'page' - elements are created standalone for the component template.
For page content: Provide 'page' (route UUID) to attach elements directly.

IMPORTANT: Use the returned root element UUID in save_file's template array.`,
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
        test: {
          type: 'boolean',
          description: 'If true, returns structure without creating elements',
        },
      },
      required: ['elements'],
    },
  },
  {
    name: 'list_globals',
    description: 'List all global files in the Application database. Globals are reusable, curated code (controllers, models, services) that can be installed into tenant projects.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_global',
    description: 'Get a global file with all its methods, statements, and clauses. Returns the full structure of a reusable code file.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the global file to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'install_global',
    description: 'Install a global file from the Application database into a tenant project. Copies the file, methods, and statements to the tenant database with the same UUIDs (for deduplication). Clauses remain shared in the Application DB.',
    inputSchema: {
      type: 'object',
      properties: {
        file_uuid: {
          type: 'string',
          description: 'UUID of the global file to install',
        },
        directory_uuid: {
          type: 'string',
          description: 'UUID of the directory in the tenant project to install the file into',
        },
      },
      required: ['file_uuid', 'directory_uuid'],
    },
  },
  {
    name: 'search_global_methods',
    description: 'Search for methods across the Application database (global/framework methods). Use this to find reusable Laravel framework methods, facades, and shared code.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find methods by name',
        },
      },
      required: ['query'],
    },
  },
  // Module tools (groups of globals)
  {
    name: 'list_modules',
    description: 'List all available modules. A module is a named collection of related global files that can be installed together as a package.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_module',
    description: 'Get a module with all its files. Returns the module metadata and list of global files it contains, in installation order.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          description: 'UUID of the module to retrieve',
        },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'create_module',
    description: 'Create a new module to group related global files together.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Unique name for the module (e.g., "laravel-sanctum-auth")',
        },
        description: {
          type: 'string',
          description: 'Description of what the module provides',
        },
        version: {
          type: 'string',
          description: 'Version string (default: "1.0.0")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization (e.g., ["auth", "api", "sanctum"])',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_file_to_module',
    description: 'Add a global file to a module. Files are installed in order when the module is installed.',
    inputSchema: {
      type: 'object',
      properties: {
        module_uuid: {
          type: 'string',
          description: 'UUID of the module',
        },
        file_uuid: {
          type: 'string',
          description: 'UUID of the global file to add',
        },
        order: {
          type: 'number',
          description: 'Installation order (optional, auto-increments if not specified)',
        },
      },
      required: ['module_uuid', 'file_uuid'],
    },
  },
  {
    name: 'install_module',
    description: 'Install all files from a module into a tenant project. Copies files, methods, and statements in the defined order. Clauses remain shared in the Application DB.',
    inputSchema: {
      type: 'object',
      properties: {
        module_uuid: {
          type: 'string',
          description: 'UUID of the module to install',
        },
        directory_uuid: {
          type: 'string',
          description: 'UUID of the directory in the tenant project to install files into',
        },
      },
      required: ['module_uuid', 'directory_uuid'],
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

IMPORTANT: This is a TWO-STEP process:
1. create_statement → returns statement UUID
2. add_statement_code → adds the actual code to that statement

Use cases:
- PHP: Class properties, use statements, constants
- JS/Vue: Variable declarations, imports, reactive refs

For Vue components, include the returned statement UUID in save_file's 'data' array.`,
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
    name: 'add_statement_code',
    description: `Add code to an existing statement. This is step 2 of 2 - call this AFTER create_statement.

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

For <script setup> content, the order in statements array determines output order.`,
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
          description: 'Array of file UUIDs to import',
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
];

// Server instructions for tool discovery (used by MCP Tool Search)
const SERVER_INSTRUCTIONS = `Stellify is a coding platform where you code alongside AI on a codebase maintained and curated by AI. Build Laravel/PHP and Vue.js applications.

Use Stellify tools when:
- Building PHP controllers, models, middleware, or classes
- Creating Vue.js components with reactive state and UI
- Managing UI elements (HTML stored as structured JSON)
- Working with a Stellify project (user will mention "Stellify" or provide project UUID)

Key concepts:
- Code is stored as structured JSON, enabling surgical AI edits at the statement level
- Files contain methods and statements (code outside methods)
- Vue components link to UI elements via the 'template' field
- Event handlers (click, submit) wire UI elements to methods by UUID`;

// Create MCP server
const server = new Server(
  {
    name: 'stellify-mcp',
    version: '0.1.0',
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
      case 'get_project': {
        const result = await stellify.getProject();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Active project: "${result.data?.name || result.name}" (${result.data?.uuid || result.uuid})`,
                project: result.data || result,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_file': {
        const result = await stellify.createFile(args as any);
        const fileData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created file "${(args as any).name}" (UUID: ${fileData.uuid})`,
                file: fileData,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_method': {
        const result = await stellify.createMethod(args as any);
        const methodData = result.data || result;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created method "${(args as any).name}" (UUID: ${methodData.uuid})`,
                method: methodData,
              }, null, 2),
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

      case 'search_routes': {
        const result = await stellify.searchRoutes(args as any);
        const routes = result.data || result;
        const routeCount = Array.isArray(routes) ? routes.length : Object.keys(routes).length;
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

      case 'list_globals': {
        const result = await stellify.listGlobals();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Found ${result.data?.length || 0} globals`,
                globals: result.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_global': {
        const { uuid } = args as any;
        const result = await stellify.getGlobal(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                global: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'install_global': {
        const result = await stellify.installGlobal(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Installed global "${result.data?.file_name}" (${result.data?.methods_copied} methods, ${result.data?.statements_copied} statements)`,
                data: result.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'search_global_methods': {
        const result = await stellify.searchGlobalMethods(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Found ${result.data?.length || 0} global methods`,
                methods: result.data,
              }, null, 2),
            },
          ],
        };
      }

      // Module handlers
      case 'list_modules': {
        const result = await stellify.listModules();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Found ${result.data?.length || 0} modules`,
                modules: result.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_module': {
        const { uuid } = args as any;
        const result = await stellify.getModule(uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                module: result.module,
                files: result.files,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_module': {
        const result = await stellify.createModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created module "${result.data?.name}"`,
                data: result.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'add_file_to_module': {
        const result = await stellify.addFileToModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Added "${result.data?.file_name}" to module (order: ${result.data?.order})`,
                data: result.data,
              }, null, 2),
            },
          ],
        };
      }

      case 'install_module': {
        const result = await stellify.installModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Installed module "${result.data?.module_name}" (${result.data?.files_installed} files, ${result.data?.methods_copied} methods, ${result.data?.statements_copied} statements)`,
                data: result.data,
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

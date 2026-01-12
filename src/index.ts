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
const tools: Tool[] = [
  {
    name: 'create_file',
    description: 'Create a new file (class, model, controller, middleware) in a Stellify project. This creates the file structure but no methods yet.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the Stellify project',
        },
        name: {
          type: 'string',
          description: 'File name (e.g., "Calculator", "UserController")',
        },
        type: {
          type: 'string',
          enum: ['class', 'model', 'controller', 'middleware'],
          description: 'Type of file to create',
        },
        namespace: {
          type: 'string',
          description: 'PHP namespace (e.g., "App\\Services\\", "App\\Http\\Controllers\\")',
        },
      },
      required: ['project_id', 'name', 'type'],
    },
  },
  {
    name: 'create_method',
    description: 'Create a method signature in a file. This only creates the method declaration, not the body. Use add_method_body to add implementation.',
    inputSchema: {
      type: 'object',
      properties: {
        file_uuid: {
          type: 'string',
          description: 'UUID of the file to add the method to',
        },
        name: {
          type: 'string',
          description: 'Method name (e.g., "add", "store", "index")',
        },
        visibility: {
          type: 'string',
          enum: ['public', 'protected', 'private'],
          description: 'Method visibility',
          default: 'public',
        },
        is_static: {
          type: 'boolean',
          description: 'Whether the method is static',
          default: false,
        },
        return_type: {
          type: 'string',
          description: 'Return type (e.g., "int", "string", "JsonResponse", "void")',
        },
        parameters: {
          type: 'array',
          description: 'Array of method parameters',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Parameter name (without $)',
              },
              type: {
                type: 'string',
                description: 'Parameter type (e.g., "int", "string", "Request")',
              },
            },
            required: ['name', 'type'],
          },
        },
      },
      required: ['file_uuid', 'name'],
    },
  },
  {
    name: 'add_method_body',
    description: 'Parse and add PHP code to a method body. Provide the method implementation code (without the function declaration). Stellify will parse it into structured statements.',
    inputSchema: {
      type: 'object',
      properties: {
        file_uuid: {
          type: 'string',
          description: 'UUID of the file containing the method',
        },
        method_uuid: {
          type: 'string',
          description: 'UUID of the method to add code to',
        },
        code: {
          type: 'string',
          description: 'PHP code for the method body (just the statements, no function declaration). Example: "return $a + $b;"',
        },
      },
      required: ['file_uuid', 'method_uuid', 'code'],
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
          description: 'Route/page name (e.g., "Home", "Todos", "About")',
        },
        path: {
          type: 'string',
          description: 'URL path (e.g., "/", "/todos", "/about")',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
          default: 'GET',
        },
        type: {
          type: 'string',
          description: 'Route type (e.g., "page", "api")',
          default: 'page',
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

Example:
{
  "uuid": "element-uuid",
  "data": {
    "name": "Email Input",
    "tag": "input",
    "type": "email",
    "placeholder": "Enter email",
    "classes": ["form-input", "w-full"],
    "required": true
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

Instead of creating elements one-by-one, write standard HTML with full attributes and this will:
1. Parse the HTML structure
2. Create all elements with proper nesting
3. Preserve all attributes, classes, text content
4. Attach to page or parent element

Example HTML:
<div class="container mx-auto p-4">
  <form method="POST" action="/contact">
    <input type="email" placeholder="Email" required class="form-input" />
    <button type="submit" class="btn-primary">Send</button>
  </form>
</div>

Use 'test: true' to preview the structure without creating.`,
    inputSchema: {
      type: 'object',
      properties: {
        elements: {
          type: 'string',
          description: 'HTML string to convert (can be full page structure or fragments)',
        },
        page: {
          type: 'string',
          description: 'Route UUID to attach root element to (for top-level elements)',
        },
        selection: {
          type: 'string',
          description: 'Parent element UUID to attach to (for nested elements)',
        },
        test: {
          type: 'boolean',
          description: 'If true, returns structure without creating elements (for preview)',
          default: false,
        },
      },
      required: ['elements'],
    },
  },
];

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
      case 'create_file': {
        const result = await stellify.createFile(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created file "${(args as any).name}" (${result.uuid})`,
                file: result,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_method': {
        const result = await stellify.createMethod(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created method "${(args as any).name}" (${result.uuid})`,
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
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Created route "${(args as any).name}" at ${(args as any).path}`,
                route: result,
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

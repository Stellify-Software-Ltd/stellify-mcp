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

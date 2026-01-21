# Stellify MCP Server

[![npm version](https://badge.fury.io/js/@stellisoft%2Fstellify-mcp.svg)](https://www.npmjs.com/package/@stellisoft/stellify-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol (MCP) server for [Stellify](https://stellisoft.com) - the AI-native code generation platform.

## What is This?

This MCP server lets AI assistants (like Claude Desktop) interact with your Stellify projects to build Laravel and Vue.js applications incrementally. Instead of generating full code files at once, AI can:

- Create file structures (classes, controllers, models, middleware, Vue components)
- Add method signatures with type hints
- Parse PHP/JavaScript code into structured JSON (statement-by-statement)
- Convert HTML to Stellify elements in a single operation
- Search existing code in your projects
- Install reusable code from the global library
- Build applications through natural conversation

## Quick Start

### Prerequisites

- **Node.js 18 or higher**
- **A Stellify account** - Sign up at [stellisoft.com](https://stellisoft.com)
- **Claude Desktop** (or another MCP-compatible AI client)

### Installation

Install globally via npm:

```bash
npm install -g @stellisoft/stellify-mcp
```

### Configuration

1. **Get your Stellify API token:**
   - Log into [Stellify](https://stellisoft.com)
   - Navigate to Settings → API Tokens
   - Click "Create New Token"
   - Copy your token

2. **Configure Claude Desktop:**

   Edit your Claude Desktop configuration file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/claude/claude_desktop_config.json`

   Add the Stellify MCP server:

   ```json
   {
     "mcpServers": {
       "stellify": {
         "command": "stellify-mcp",
         "env": {
           "STELLIFY_API_URL": "https://api.stellisoft.com/v1",
           "STELLIFY_API_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

That's it! The Stellify tools should now be available in Claude Desktop.

## Usage

Once configured, you can talk to Claude naturally to build applications:

### Example Conversations

**Create a new controller:**
```
"Create a UserController in my Stellify project"
```

**Add methods:**
```
"Add a method called 'store' that takes a Request parameter and returns a JsonResponse"
```

**Implement method logic:**
```
"Add this implementation to the store method:
$user = User::create($request->validated());
return response()->json($user, 201);"
```

**Build a Vue component:**
```
"Create a Counter component with an increment button"
```

**Convert HTML to elements:**
```
"Convert this HTML to Stellify elements:
<div class='container'><h1>Hello</h1><button>Click me</button></div>"
```

**Search your codebase:**
```
"Search for all controller files in my project"
"Find methods related to authentication"
```

## Available Tools

### Project & Directory Tools

#### `get_project`
Get the active Stellify project for the authenticated user. **Call this first before any other operations.**

**Parameters:** None

**Returns:**
- `uuid`: Project UUID (needed for most operations)
- `name`: Project name
- `directories`: Array of `{uuid, name}` for existing directories

---

#### `get_directory`
Get a directory by UUID to see its contents.

**Parameters:**
- `uuid` (required): The UUID of the directory

---

#### `create_directory`
Create a new directory for organizing files.

**Parameters:**
- `name` (required): Directory name (e.g., "js", "css", "components")

---

### File Tools

#### `create_file`
Create a new file in a Stellify project. This creates an empty file shell - no methods, statements, or template yet.

**Parameters:**
- `directory` (required): UUID of the directory (get from `get_project` directories array)
- `name` (required): File name without extension (e.g., "Counter", "UserController")
- `type` (required): File type - "class", "model", "controller", "middleware", or "js"
- `extension` (optional): File extension. Use "vue" for Vue components.
- `namespace` (optional): PHP namespace (e.g., "App\\Services\\"). Only for PHP files.
- `includes` (optional): Array of fully-qualified class names to import (e.g., `["App\\Models\\User", "Illuminate\\Http\\Request"]`). Stellify will resolve these to file UUIDs, fetching from Laravel API or vendor directory if needed.

**Directory selection:** Match the directory to your file's purpose. If the directory doesn't exist, create it first with `create_directory`.

| File Type | Directory | Namespace |
|-----------|-----------|-----------|
| Controllers | `controllers` | `App\Http\Controllers\` |
| Models | `models` | `App\Models\` |
| Services | `services` | `App\Services\` |
| Middleware | `middleware` | `App\Http\Middleware\` |
| Vue/JS | `js` | N/A |

**Example workflow:**
1. `create_file` → creates empty shell, returns file UUID
2. `create_statement` + `add_statement_code` → add variables/imports
3. `create_method` + `add_method_body` → add functions
4. `html_to_elements` → create template elements (for Vue)
5. `save_file` → finalize with all UUIDs wired together

**Auto-dependency creation** (when `auto_create_dependencies: true`):

When you create a file with code like:
```php
<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $user = User::create($request->validated());
        return response()->json($user);
    }
}
```

Stellify will:
1. Parse `use` statements to find dependencies (`User`, `Request`, `Socialite`)
2. Check Application DB for framework classes → find cached classes
3. For core Laravel classes → fetch from [api.laravel.com](https://api.laravel.com/docs/12.x/)
4. For vendor packages (Socialite, Spatie, etc.) → read from `vendor/` directory
5. Create missing App classes → create `User` model file
6. Wire up the file's `includes` array with all dependency UUIDs

**Supported sources:**
- **Laravel API** - Core `Illuminate\*` classes fetched from api.laravel.com
- **Vendor packages** - `Laravel\Socialite\*`, `Laravel\Cashier\*`, `Spatie\*`, `Livewire\*`, etc. read directly from your `vendor/` directory using PHP-Parser

The response includes a `dependencies` report showing what was created/resolved and from which source.

---

#### `get_file`
Get a file by UUID with all its metadata, methods, and statements.

**Parameters:**
- `uuid` (required): UUID of the file

---

#### `save_file`
Save/update a file with its full configuration. This finalizes the file after `create_file`.

**Parameters:**
- `uuid` (required): UUID of the file
- `name` (required): File name (without extension)
- `type` (required): File type ("js", "class", "controller", "model", "middleware")
- `extension` (optional): File extension ("vue" for Vue SFCs)
- `template` (optional): Array of root element UUIDs for Vue `<template>` section
- `data` (optional): Array of METHOD UUIDs only (functions)
- `statements` (optional): Array of STATEMENT UUIDs (imports, variables, refs)
- `includes` (optional): Array of file UUIDs to import

**Important:** `data` = method UUIDs only, `statements` = statement UUIDs (code outside methods)

---

#### `search_files`
Search for files in the project by name or type.

**Parameters:**
- `name` (optional): File name pattern to search for
- `type` (optional): File type filter

---

### Method Tools

#### `create_method`
Create a method signature in a file (without implementation).

**Parameters:**
- `file` (required): UUID of the file to add the method to
- `name` (required): Method name (e.g., "increment", "store", "handleClick")
- `visibility` (optional): "public", "protected", or "private" (PHP only, default: "public")
- `is_static` (optional): Whether the method is static (PHP only, default: false)
- `returnType` (optional): Return type (e.g., "int", "string", "void")
- `parameters` (optional): Array of `{name, type}` objects

---

#### `add_method_body`
Parse and add code to a method body. Stellify parses the code into structured JSON statements.

**Parameters:**
- `file_uuid` (required): UUID of the file containing the method
- `method_uuid` (required): UUID of the method to add code to
- `code` (required): Code for the method body (just the statements, no function declaration)

**Example:**
```
code: "return $a + $b;"
```

---

#### `search_methods`
Search for methods in the project by name or within a specific file.

**Parameters:**
- `name` (optional): Method name to search for (supports wildcards)
- `file_uuid` (optional): Filter results to a specific file

---

### Statement Tools

#### `create_statement`
Create an empty statement in a file. This is step 1 of 2 - you must call `add_statement_code` next.

**Parameters:**
- `file` (optional): UUID of the file to add the statement to
- `method` (optional): UUID of the method to add the statement to (for method body statements)

**Use cases:**
- PHP: Class properties, use statements, constants
- JS/Vue: Variable declarations, imports, reactive refs

---

#### `add_statement_code`
Add code to an existing statement. This is step 2 of 2 - call after `create_statement`.

**Parameters:**
- `file_uuid` (required): UUID of the file containing the statement
- `statement_uuid` (required): UUID of the statement to add code to
- `code` (required): The code to add

**Examples:**
```
code: "use Illuminate\\Http\\Request;"
code: "const count = ref(0);"
code: "import { ref } from 'vue';"
```

---

#### `get_statement`
Get a statement by UUID with its clauses (code tokens).

**Parameters:**
- `uuid` (required): The UUID of the statement

---

### Route Tools

#### `create_route`
Create a new route/page in a Stellify project.

**Parameters:**
- `project_id` (required): The UUID of the Stellify project
- `name` (required): Route/page name (e.g., "Home", "Counter", "About")
- `path` (required): URL path (e.g., "/", "/counter", "/about")
- `method` (required): HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH")
- `type` (optional): Route type - "web" for pages, "api" for API endpoints (default: "web")
- `data` (optional): Additional route data

---

#### `get_route`
Get a route/page by UUID.

**Parameters:**
- `uuid` (required): The UUID of the route

---

#### `search_routes`
Search for routes/pages in the project by name.

**Parameters:**
- `search` (optional): Search term to match route names
- `type` (optional): Filter by route type ("web" or "api")
- `per_page` (optional): Results per page (default: 10)

---

### Element Tools (UI Components)

#### `create_element`
Create a new UI element. Provide either `page` (route UUID) for root elements, or `parent` (element UUID) for child elements.

**Parameters:**
- `type` (required): Element type - one of:
  - HTML5: `s-wrapper`, `s-input`, `s-form`, `s-svg`, `s-shape`, `s-media`, `s-iframe`
  - Components: `s-loop`, `s-transition`, `s-freestyle`, `s-motion`
  - Blade: `s-directive`
  - Shadcn/ui: `s-chart`, `s-table`, `s-combobox`, `s-accordion`, `s-calendar`, `s-contiguous`
- `page` (optional): UUID of the page/route (for root elements)
- `parent` (optional): UUID of the parent element (for child elements)

---

#### `update_element`
Update an existing UI element.

**Parameters:**
- `uuid` (required): UUID of the element to update
- `data` (required): Object with HTML attributes and Stellify fields

**Standard HTML attributes:** `placeholder`, `href`, `src`, `type`, etc.

**Stellify fields:**
- `name`: Element name in editor
- `type`: Element type
- `locked`: Prevent editing (boolean)
- `tag`: HTML tag (div, input, button, etc.)
- `classes`: CSS classes array `["class1", "class2"]`
- `text`: Element text content

**Event handlers** (set value to method UUID):
- `click`: @click
- `submit`: @submit
- `change`: @change
- `input`: @input
- `focus`: @focus
- `blur`: @blur
- `keydown`: @keydown
- `keyup`: @keyup
- `mouseenter`: @mouseenter
- `mouseleave`: @mouseleave

---

#### `get_element`
Get a single element by UUID.

**Parameters:**
- `uuid` (required): UUID of the element

---

#### `get_element_tree`
Get an element with all its descendants as a hierarchical tree structure.

**Parameters:**
- `uuid` (required): UUID of the root element

---

#### `delete_element`
Delete an element and all its children (CASCADE).

**Parameters:**
- `uuid` (required): UUID of the element to delete

---

#### `search_elements`
Search for elements in the project.

**Parameters:**
- `search` (optional): Search query to match element name, type, or content
- `type` (optional): Filter by element type
- `include_metadata` (optional): Include additional metadata (default: false)
- `per_page` (optional): Results per page, 1-100 (default: 20)

---

#### `html_to_elements`
Convert HTML to Stellify elements in ONE operation. This is the fastest way to build interfaces!

**Parameters:**
- `elements` (required): HTML string to convert
- `page` (optional): Route UUID to attach elements to. Omit for Vue components.
- `selection` (optional): Parent element UUID to attach to (alternative to page)
- `test` (optional): If true, returns structure without creating elements

**Features:**
- Parses HTML structure
- Creates all elements with proper nesting
- Preserves attributes, classes, text content
- Auto-detects Vue bindings (`{{ variable }}`) and creates linked statements
- Returns element UUIDs for use in `save_file` template array

**Element type mapping:**
- `button`, `input`, `textarea`, `select` → `s-input`
- `div`, `span`, `p`, `section`, etc. → `s-wrapper`
- `form` → `s-form`
- `img`, `video`, `audio` → `s-media`

---

### Global Library Tools

#### `list_globals`
List all global files in the Application database. Globals are reusable, curated code that can be installed into tenant projects.

**Parameters:** None

---

#### `get_global`
Get a global file with all its methods, statements, and clauses.

**Parameters:**
- `uuid` (required): UUID of the global file

---

#### `install_global`
Install a global file from the Application database into a tenant project.

**Parameters:**
- `file_uuid` (required): UUID of the global file to install
- `directory_uuid` (required): UUID of the directory to install into

---

#### `search_global_methods`
Search for methods across the Application database (global/framework methods).

**Parameters:**
- `query` (required): Search query to find methods by name

---

### Module Tools

Modules are named collections of related global files that can be installed together.

#### `list_modules`
List all available modules.

**Parameters:** None

---

#### `get_module`
Get a module with all its files.

**Parameters:**
- `uuid` (required): UUID of the module

---

#### `create_module`
Create a new module to group related global files.

**Parameters:**
- `name` (required): Unique name for the module (e.g., "laravel-sanctum-auth")
- `description` (optional): Description of what the module provides
- `version` (optional): Version string (default: "1.0.0")
- `tags` (optional): Tags for categorization (e.g., `["auth", "api", "sanctum"]`)

---

#### `add_file_to_module`
Add a global file to a module.

**Parameters:**
- `module_uuid` (required): UUID of the module
- `file_uuid` (required): UUID of the global file to add
- `order` (optional): Installation order (auto-increments if not specified)

---

#### `install_module`
Install all files from a module into a tenant project.

**Parameters:**
- `module_uuid` (required): UUID of the module to install
- `directory_uuid` (required): UUID of the directory to install files into

---

## How Stellify Works

Stellify stores your application code as **structured JSON** in a database, not text files. This architecture enables:

- **Surgical precision:** AI modifies specific methods without touching other code
- **Query your codebase like data:** Find all methods that use a specific class
- **Instant refactoring:** Rename a method across your entire application instantly
- **Version control at the statement level:** Track changes to individual code statements
- **AI-native development:** Give AI granular access without worrying about breaking existing code
- **Auto-dependency resolution:** Framework classes are automatically fetched from Laravel API docs

When you build with Stellify through this MCP server, code is parsed into structured data and can be assembled back into executable code when you deploy.

### Dependency Resolution

When you use `auto_create_dependencies`, Stellify resolves dependencies in this order:

1. **Tenant Database** - Check if the class exists in your project
2. **Application Database** - Check the global library of pre-defined classes
3. **Laravel API Docs** - For core `Illuminate\*` classes, fetch from [api.laravel.com](https://api.laravel.com/docs/12.x/)
4. **Vendor Directory** - For installed packages, read directly from `vendor/`

### Supported Package Sources

| Source | Namespaces | Method |
|--------|-----------|--------|
| Laravel API | `Illuminate\*` | Fetches from api.laravel.com |
| Vendor | `Laravel\Socialite\*` | Reads from vendor/laravel/socialite |
| Vendor | `Laravel\Cashier\*` | Reads from vendor/laravel/cashier |
| Vendor | `Laravel\Sanctum\*` | Reads from vendor/laravel/sanctum |
| Vendor | `Laravel\Passport\*` | Reads from vendor/laravel/passport |
| Vendor | `Spatie\*` | Reads from vendor/spatie/* packages |
| Vendor | `Livewire\*` | Reads from vendor/livewire/livewire |
| Vendor | `Inertia\*` | Reads from vendor/inertiajs/inertia-laravel |

For vendor packages, Stellify uses PHP-Parser to extract the actual method signatures from your installed package version - ensuring accuracy with your specific dependencies.

### Code Structure

```
Directory
  └── File
        └── Method
              ├── Parameters (Clauses)
              └── Statements
                    └── Clauses / Language Tokens
```

Each piece of code is broken down into:
- **Directory**: Organizational container for files
- **File**: Contains methods and file metadata
- **Method**: Function with parameters and body statements
- **Statement**: A single line/statement of code
- **Clause**: Leaf node (variable, string, number, etc.)
- **Language Token**: System-defined keywords and symbols (reusable)

## Workflows

### PHP Controller Workflow

1. `get_project` → Find directory UUID
2. `create_file` → type='controller', name='UserController'
3. `create_method` → name='store', parameters=[{name:'request', type:'Request'}]
4. `add_method_body` → code='return response()->json($request->all());'

### Vue Component Workflow

1. `get_project` → Find the 'js' directory UUID
2. `create_file` → type='js', extension='vue' in js directory
3. Create statements for imports and data:
   - `create_statement` + `add_statement_code`: `"import { ref } from 'vue';"`
   - `create_statement` + `add_statement_code`: `"const count = ref(0);"`
4. `create_method` + `add_method_body` → Create functions
5. `html_to_elements` → Convert template HTML to elements
6. `update_element` → Wire event handlers (click → method UUID)
7. `save_file` → Finalize with:
   - `extension`: 'vue'
   - `template`: [rootElementUuid]
   - `data`: [methodUuid] (METHOD UUIDs only)
   - `statements`: [importStmtUuid, refStmtUuid] (STATEMENT UUIDs)

## Development

### Watch mode (auto-rebuild on changes):
```bash
npm run watch
```

### Manual build:
```bash
npm run build
```

## Troubleshooting

### "STELLIFY_API_TOKEN environment variable is required"
Make sure your `.env` file exists and contains your API token.

### "Connection refused" or API errors
- Verify your API token is valid
- Check that `STELLIFY_API_URL` is correct
- Test the API directly: `curl -H "Authorization: Bearer YOUR_TOKEN" https://stellisoft.com/api/v1/file/search`

### Claude Desktop doesn't see the tools
1. Verify the configuration file path is correct for your OS
2. Check that the Stellify API token is valid
3. Restart Claude Desktop completely (Quit, not just close window)
4. Check Claude Desktop logs for error messages

### TypeScript errors during build
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Installation issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm uninstall -g @stellisoft/stellify-mcp
npm install -g @stellisoft/stellify-mcp
```

## Architecture

```
Claude Desktop (AI)
       ↓ (stdio)
Stellify MCP Server (Node.js)
       ↓ (HTTPS)
Stellify API (Laravel)
       ↓
Database (Structured Code)
```

The MCP server is a thin client that:
1. Exposes tools to Claude
2. Translates tool calls to API requests
3. Returns formatted responses

## Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit pull requests.

## Support

For issues or questions:
- **GitHub Issues:** [Report a bug or request a feature](https://github.com/Stellify-Software-Ltd/stellify-mcp/issues)
- **Email:** support@stellisoft.com
- **Documentation:** https://stellisoft.com/docs
- **Discord:** Join our community (coming soon)

## About Stellify

Stellify is building the future of AI-native software development. By storing code as structured data instead of text files, we enable a new paradigm where AI and humans collaborate seamlessly to build better software, faster.

Learn more at [stellisoft.com](https://stellisoft.com)

## License

MIT License - see [LICENSE](LICENSE) file for details

---

Built with love by the Stellify team

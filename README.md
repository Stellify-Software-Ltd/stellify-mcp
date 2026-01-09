# Stellify MCP Server

[![npm version](https://badge.fury.io/js/@stellisoft%2Fstellify-mcp.svg)](https://www.npmjs.com/package/@stellisoft/stellify-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol (MCP) server for [Stellify](https://stellisoft.com) - the AI-native code generation platform.

## What is This?

This MCP server lets AI assistants (like Claude Desktop) interact with your Stellify projects to build Laravel applications incrementally. Instead of generating full code files at once, AI can:

- 🏗️ Create file structures (classes, controllers, models, middleware)
- 📝 Add method signatures with type hints
- 🔍 Parse PHP code into structured JSON (statement-by-statement)
- 🔎 Search existing code in your projects
- 🚀 Build Laravel applications through natural conversation

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

Once configured, you can talk to Claude naturally to build Laravel applications:

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

**Search your codebase:**
```
"Search for all controller files in my project"
"Find methods related to authentication"
```

## Available Tools

### `create_file`
Create a new file (class, controller, model, middleware) in a Stellify project.

**Parameters:**
- `project_id` (required): Stellify project UUID
- `name` (required): File name (e.g., "Calculator", "UserController")
- `type` (required): File type - "class", "model", "controller", or "middleware"
- `namespace` (optional): PHP namespace (e.g., "App\\Services\\")

**Example:**
```
Create a Calculator class in my Stellify project abc-123
```

### `create_method`
Create a method signature in a file (without implementation).

**Parameters:**
- `file_uuid` (required): UUID of the file
- `name` (required): Method name (e.g., "add", "store")
- `visibility` (optional): "public", "protected", or "private" (default: "public")
- `is_static` (optional): boolean (default: false)
- `return_type` (optional): Return type (e.g., "int", "JsonResponse")
- `parameters` (optional): Array of `{name, type}` objects

**Example:**
```
Add a public method called "add" that takes two integers and returns an integer
```

### `add_method_body`
Parse and add PHP code to a method body.

**Parameters:**
- `file_uuid` (required): UUID of the file
- `method_uuid` (required): UUID of the method
- `code` (required): PHP code (just the body, no function declaration)

**Example:**
```
Add this implementation to the add method: return $a + $b;
```

### `search_methods`
Search for methods in the project.

**Parameters:**
- `name` (optional): Method name to search for
- `file_uuid` (optional): Filter to specific file

### `search_files`
Search for files in the project.

**Parameters:**
- `name` (optional): File name pattern
- `type` (optional): File type filter

## How Stellify Works

Stellify stores your Laravel application code as **structured JSON** in a database, not text files. This architecture enables:

- **Surgical precision:** AI modifies specific methods without touching other code
- **Query your codebase like data:** Find all methods that use a specific class
- **Instant refactoring:** Rename a method across your entire application instantly
- **Version control at the statement level:** Track changes to individual code statements
- **AI-native development:** Give AI granular access without worrying about breaking existing code

When you build with Stellify through this MCP server, code is parsed into structured data and can be assembled back into executable PHP when you deploy.

## The Incremental Workflow

Stellify works incrementally, not by parsing entire files at once:

1. **Create Structure** → File skeleton with no methods
2. **Add Signatures** → Method declarations without bodies
3. **Parse Bodies** → Statement-by-statement implementation
4. **Assemble** → Stellify converts structured data back to PHP

This gives AI surgical control over your code.

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
- Verify the path in `config.json` is absolute and correct
- Restart Claude Desktop
- Check Claude Desktop logs for errors

### TypeScript errors during build
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
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

## Next Steps

After Phase 1 works, we'll add:
- Global method library (reference battle-tested code)
- Contribute methods to global library
- Rich metadata extraction
- Usage statistics

## Troubleshooting

### Claude Desktop doesn't see the tools

1. Verify the configuration file path is correct for your OS
2. Check that the Stellify API token is valid
3. Restart Claude Desktop completely (Quit, not just close window)
4. Check Claude Desktop logs for error messages

### API connection errors

- Verify your API token at https://stellisoft.com/settings/tokens
- Check that `STELLIFY_API_URL` is correct
- Ensure your Stellify account is active

### Installation issues

```bash
# Clear npm cache and reinstall
npm cache clean --force
npm uninstall -g @stellisoft/stellify-mcp
npm install -g @stellisoft/stellify-mcp
```

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

Built with ❤️ by the Stellify team

# Stellify MCP Server Launch Announcements

## Twitter/X (280 characters)

🚀 Just launched Stellify MCP Server - build Laravel apps through natural conversation with Claude!

Store code as structured JSON for surgical AI edits, instant refactoring & version control at the statement level.

Try it: npm install -g @stellisoft/stellify-mcp

https://github.com/Stellify-Software-Ltd/stellify-mcp

#AI #Laravel #Claude #AITooling

---

## LinkedIn Post

🎉 Excited to announce the launch of Stellify MCP Server!

We've just released an open-source Model Context Protocol (MCP) server that lets you build Laravel applications through natural conversation with Claude Desktop.

🔥 What makes Stellify different?

Instead of text files, Stellify stores your code as structured JSON in a database. This enables:

✅ Surgical precision - AI modifies specific methods without touching other code
✅ Query your codebase like data - Find all methods using a specific class
✅ Instant refactoring - Rename across your entire app instantly
✅ Statement-level version control - Track changes granularly
✅ AI-native development - Give AI access without breaking existing code

🚀 Get Started:
```
npm install -g @stellisoft/stellify-mcp
```

Then configure Claude Desktop and start building Laravel apps through conversation.

📦 npm: https://www.npmjs.com/package/@stellisoft/stellify-mcp
🔧 GitHub: https://github.com/Stellify-Software-Ltd/stellify-mcp
📖 Docs: https://stellisoft.com/docs

This is just the beginning. We're building the future of AI-native software development where code is data, and collaboration between humans and AI is seamless.

Would love your feedback! Try it out and let me know what you think.

#Laravel #AI #SoftwareDevelopment #OpenSource #Claude #Anthropic #WebDevelopment #PHP

---

## Reddit (r/laravel, r/PHP, r/ClaudeAI)

**Title:** [Release] Stellify MCP Server - Build Laravel Apps Through Conversation with Claude

**Body:**

Hey everyone! 👋

I'm excited to share something I've been working on - an MCP (Model Context Protocol) server that lets you build Laravel applications through natural conversation with Claude Desktop.

## What is this?

Stellify MCP Server bridges Claude Desktop with Stellify, an AI-native code generation platform. Instead of working with text files, Stellify stores your Laravel code as structured JSON in a database.

## Why does this matter?

**Traditional approach:**
- AI generates entire files at once
- Hard to make surgical changes
- Easy to break existing code
- No granular version control

**With Stellify:**
- Create files incrementally (classes, controllers, models)
- Add methods one at a time with type hints
- Parse PHP code statement-by-statement
- Query your codebase like data
- Instant refactoring across your entire app
- Version control at the statement level

## Quick Start

```bash
# Install globally
npm install -g @stellisoft/stellify-mcp

# Configure Claude Desktop (see repo for details)
# Then just talk naturally:
# "Create a UserController in my Stellify project"
# "Add a store method that validates and saves a user"
```

## Example Conversation

```
You: "Create a UserController with a store method"
Claude: [Creates controller structure]

You: "Add validation for email and password"
Claude: [Adds validated request handling]

You: "Now add the logic to save the user and return JSON"
Claude: [Implements the logic]
```

All code is parsed into structured JSON and stored in a database, giving you surgical control and the ability to query/refactor at scale.

## Links

- 📦 **npm:** https://www.npmjs.com/package/@stellisoft/stellify-mcp
- 🔧 **GitHub:** https://github.com/Stellify-Software-Ltd/stellify-mcp
- 📖 **Stellify:** https://stellisoft.com

This is v0.1.1 - the first public release. I'd love to hear your feedback and any features you'd like to see!

---

## Hacker News

**Title:** Stellify MCP Server – Build Laravel apps through conversation with Claude

**URL:** https://github.com/Stellify-Software-Ltd/stellify-mcp

**Comment to add context:**

Author here. I built this MCP server for Stellify, a platform where code is stored as structured JSON instead of text files.

The key insight: when you store code as data, you can query it like data. Want to find every method that calls a specific function? Just query the database. Want to rename a method across your entire app? Update one record.

For AI, this means surgical precision. Instead of regenerating entire files (and potentially breaking things), AI can modify individual statements. It's like giving AI a scalpel instead of a sledgehammer.

The MCP server lets Claude Desktop interact with Stellify projects, so you can build Laravel apps through natural conversation while maintaining fine-grained control.

Would love feedback from the HN community. What other languages/frameworks would you want to see this for?

---

## Dev.to Article

**Title:** Introducing Stellify MCP Server: Build Laravel Apps Through Conversation

**Tags:** #laravel #ai #claude #php #opensource

**Article:**

# Introducing Stellify MCP Server: Build Laravel Apps Through Conversation

Have you ever wished you could just _describe_ what you want your code to do, and have it built incrementally with precision? That's exactly what Stellify MCP Server enables.

## The Problem with Traditional AI Coding

When AI generates code, it typically:
1. Generates entire files at once
2. Can't make surgical changes to existing code
3. Lacks context about your project structure
4. Can easily break working code

## The Stellify Approach

Stellify takes a different approach: **code as structured data**.

Instead of storing your Laravel application as text files, Stellify stores it as JSON in a database. Each class, method, statement, and even operator has its own database record with metadata.

This enables:

- **Surgical Precision:** AI modifies specific methods without touching other code
- **Query Your Codebase:** Find all methods using a specific class with a database query
- **Instant Refactoring:** Rename a method across your entire app by updating one record
- **Statement-Level Version Control:** Track changes at the granular level
- **AI-Native Development:** Give AI access without worrying about breaking things

## How It Works

The MCP (Model Context Protocol) server acts as a bridge between Claude Desktop and your Stellify projects.

### Installation

```bash
npm install -g @stellisoft/stellify-mcp
```

### Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "stellify": {
      "command": "stellify-mcp",
      "env": {
        "STELLIFY_API_URL": "https://api.stellisoft.com/v1",
        "STELLIFY_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Usage

Just talk naturally to Claude:

**You:** "Create a UserController in my Stellify project"

**Claude:** [Creates the controller structure]

**You:** "Add a store method that validates email and password, then saves the user"

**Claude:** [Creates method signature, adds validation, implements save logic]

**You:** "Return a JSON response with the created user"

**Claude:** [Adds the return statement]

Every step is parsed into structured JSON and stored precisely in the database.

## What's Inside?

The MCP server provides these tools to Claude:

- `create_file` - Create classes, controllers, models, middleware
- `create_method` - Add method signatures with parameters and return types
- `add_method_body` - Parse and store PHP code statement-by-statement
- `search_files` - Find files in your project
- `search_methods` - Find methods by name or signature

## The Future

This is just v0.1.1 - the beginning. Future plans include:

- Global method library (reuse battle-tested code across projects)
- Support for more frameworks (React, Vue, Node.js)
- Rich metadata extraction (complexity analysis, dependencies)
- Team collaboration features
- Visual code editor integrated with the database

## Try It Out

- 📦 npm: https://www.npmjs.com/package/@stellisoft/stellify-mcp
- 🔧 GitHub: https://github.com/Stellify-Software-Ltd/stellify-mcp
- 📖 Docs: https://stellisoft.com/docs

I'd love to hear your thoughts! What would you build with this?

---

## Product Hunt

**Tagline:** Build Laravel apps through conversation with Claude Desktop

**Description:**

Stellify MCP Server lets you build Laravel applications through natural conversation with Claude Desktop. Unlike traditional AI coding tools, Stellify stores code as structured JSON in a database, enabling surgical precision, instant refactoring, and query-like access to your entire codebase.

**Key Features:**
• Create files, methods, and code incrementally
• AI modifies specific methods without touching other code
• Query your codebase like data
• Statement-level version control
• Open source & free to use

**What makes us different:**
Most AI coding tools work with text files, leading to imprecise changes and broken code. Stellify stores code as structured data, giving AI (and you) surgical control over every statement, method, and class.

**Getting Started:**
```
npm install -g @stellisoft/stellify-mcp
```
Configure Claude Desktop, then start building through conversation!

---

## Email Template (for Laravel newsletters, dev communities)

**Subject:** New MCP Server: Build Laravel Apps Through Conversation with Claude

**Body:**

Hi [Community],

I'm excited to share Stellify MCP Server - a new way to build Laravel applications through natural conversation with Claude Desktop.

**What's different?**

Instead of text files, Stellify stores your code as structured JSON in a database. This means:

✓ AI can modify specific methods without breaking other code
✓ You can query your entire codebase like data
✓ Refactoring happens instantly across your whole app
✓ Version control works at the statement level

**Quick Example:**

```
You: "Create a PostController with CRUD methods"
Claude: [Creates controller structure]

You: "Add validation to the store method"
Claude: [Adds FormRequest validation]

You: "Search for all methods that use the Post model"
Claude: [Returns searchable results from your database]
```

**Try it out:**

```bash
npm install -g @stellisoft/stellify-mcp
```

Then configure Claude Desktop (instructions in the repo) and start building!

📦 npm: https://www.npmjs.com/package/@stellisoft/stellify-mcp
🔧 GitHub: https://github.com/Stellify-Software-Ltd/stellify-mcp

This is v0.1.1 - the first public release. I'd love your feedback!

Best regards,
The Stellify Team
https://stellisoft.com

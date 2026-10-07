# Installing the Stellify MCP Server (for AI agents)

Two ways to connect. Prefer the hosted remote — nothing to install.

## Option A: Hosted remote (recommended)

Add a streamable-http MCP server pointing at:

```
https://api.stellisoft.com/mcp
```

Authentication: OAuth (the server advertises discovery metadata and dynamic
client registration — clients that support MCP OAuth will walk the user
through browser sign-in automatically). Alternatively, send a Stellify API
token as a bearer header: `Authorization: Bearer <token>`.

Example (Claude Code):

```bash
claude mcp add --transport http stellify https://api.stellisoft.com/mcp
```

## Option B: Local stdio server (npm)

1. Requires Node.js >= 18. No cloning or building — install from npm:

```bash
npm install -g @stellisoft/stellify-mcp
```

(or run via `npx @stellisoft/stellify-mcp` without installing globally)

2. Configure the MCP client with command `stellify-mcp` (or `npx` with args
`["-y", "@stellisoft/stellify-mcp"]`) and these environment variables:

| Variable | Required | Value |
| --- | --- | --- |
| `STELLIFY_API_URL` | yes | `https://api.stellisoft.com/api/v1` |
| `STELLIFY_API_TOKEN` | yes | The user's Stellify API token |

Example Cline / Claude Desktop config:

```json
{
  "mcpServers": {
    "stellify": {
      "command": "npx",
      "args": ["-y", "@stellisoft/stellify-mcp"],
      "env": {
        "STELLIFY_API_URL": "https://api.stellisoft.com/api/v1",
        "STELLIFY_API_TOKEN": "<user's token>"
      }
    }
  }
}
```

3. Getting a token: the user signs in at https://stellisoft.com, opens the
editor, and uses the Connect Editor wizard to mint an API token. If the user
does not have one, ask them to retrieve it — do not guess or reuse other
credentials.

4. Verify the connection by calling the `get_project` tool: it returns the
user's active project (uuid, name, directories). If it errors with 401, the
token is wrong; with 404/empty project, the user needs to create a project at
stellisoft.com first.

No API keys for third-party services, databases, or local dependencies are
required — all execution happens on the Stellify platform.

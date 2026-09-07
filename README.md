# OpenSubtitles MCP Server

A TypeScript/Node.js-based MCP (Model Context Protocol) server for OpenSubtitles API integration. This server provides subtitle search and download functionality with a freemium model, using the Kong gateway at api.opensubtitles.com for all API management.

## Features

- **Comprehensive Search**: Search subtitles using all OpenSubtitles API parameters (title, IMDB ID, TMDB ID, file hash, etc.)
- **Multiple Download Formats**: Support for SRT, ASS, and VTT subtitle formats
- **File Hash Calculation**: Calculate OpenSubtitles hash for exact movie file matching
- **Rate Limiting**: Integrated with Kong gateway for proper rate limiting
- **Freemium Model**: Unlimited search, downloads limited by API key status
- **Key in conversation**: In stdio mode the user's API key can be handed over with the
  `set_api_key` tool, without editing a config file

## Installation & Usage

The OpenSubtitles MCP Server supports **three modes**:

- **HTTP Mode**: Streamable HTTP server you can deploy anywhere; any MCP client connects to `/mcp`
- **Stdio Mode (Local)**: Run locally for Claude Desktop / Claude Code
- **Stdio Mode (Remote)**: Connect to the hosted server at mcp.opensubtitles.com

### 1. HTTP Mode (Recommended for Server Deployment)

Run as a web server on port 1620:

```bash
# Install dependencies
npm install
npm run build

# Start HTTP server
npm start
# or
PORT=1620 MCP_MODE=http node dist/index.js
```

**Endpoints:**
- **MCP:** `http://localhost:1620/mcp` (Streamable HTTP; `/message` is an alias)
- **Health Check:** `http://localhost:1620/health`
- **API Info:** `http://localhost:1620/`
- **Direct tool call:** `http://localhost:1620/proxy` (plain HTTP POST, not MCP)

### 2. Stdio Mode (For Claude Desktop)

#### Quick Start with npx
```bash
npx @opensubtitles/mcp-server
```

#### Install via mcp-get
```bash
npx @michaellatman/mcp-get@latest install @opensubtitles/mcp-server
```

#### Claude Code Integration
For `claude-code` environments, you can add the server using the `claude mcp add-json` command:
```bash
claude mcp add-json "opensubtitles" '{"command":"npx","args":["-y","@opensubtitles/mcp-server@latest"],"env":{"MCP_MODE":"stdio","LOG_LEVEL":"info"},"disabled":false}'
```

#### Claude Desktop Integration - Local Mode
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "@opensubtitles/mcp-server"],
      "env": {
        "MCP_MODE": "stdio",
        "OPENSUBTITLES_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Claude Desktop Integration - Remote Mode
Connect to the hosted server at mcp.opensubtitles.com:

```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "@opensubtitles/mcp-server", "remote-proxy.js"]
    }
  }
}
```

Or using the dedicated remote command:

```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "mcp-opensubtitles-remote"]
    }
  }
}
```

## MCP Tools

### 1. search_subtitles

Search for subtitles with comprehensive parameter support:

**Parameters:**
- `query` (string): Text search query
- `imdb_id` (number): IMDB ID for exact matching
- `tmdb_id` (number): TMDB ID for exact matching
- `parent_imdb_id` (number): Parent IMDB ID for TV series
- `parent_tmdb_id` (number): Parent TMDB ID for TV series
- `season_number` (number): Season number for TV episodes
- `episode_number` (number): Episode number for TV episodes
- `year` (number): Release year
- `moviehash` (string): OpenSubtitles file hash for exact matching
- `moviebytesize` (number): File size in bytes for hash matching
- `languages` (string): Comma-separated language codes (e.g., 'en,es,fr')
- `machine_translated` (string): Include machine translated subtitles
- `ai_translated` (string): Include AI translated subtitles
- `hearing_impaired` (string): Include hearing impaired subtitles
- `foreign_parts_only` (string): Include foreign parts only
- `trusted_sources` (string): Only trusted sources
- `order_by` (string): Sort order
- `order_direction` (string): Sort direction (asc/desc)

**Example:**
```typescript
await mcpClient.callTool("search_subtitles", {
  query: "The Matrix",
  year: 1999,
  languages: "en"
});
```

### 2. download_subtitle

Download subtitle content by ID:

**Parameters:**
- `subtitle_id` (string, required): Subtitle ID from search results
- `format` (string): Subtitle format (srt, ass, vtt) - defaults to 'srt'
- `user_api_key` (string): Optional user API key for authenticated downloads

**Example:**
```typescript
await mcpClient.callTool("download_subtitle", {
  subtitle_id: "123456",
  format: "srt",
  user_api_key: "your_api_key"
});
```

### 3. calculate_file_hash

Calculate OpenSubtitles hash for local movie files:

**Parameters:**
- `file_path` (string, required): Path to the movie file

**Example:**
```typescript
await mcpClient.callTool("calculate_file_hash", {
  file_path: "/path/to/movie.mkv"
});
```

### 4. set_api_key (stdio mode only)

Store the user's API key, or username and password, for the current session.

```json
{
  "api_key": "your_api_key_here"
}
```

### 5. api_key_status (stdio mode only)

Report which credentials are in use (session, environment, or the shared built-in
key). Returns a masked value only.

## Usage Examples

### Search by Movie Title
```typescript
await mcpClient.callTool("search_subtitles", {
  query: "Inception",
  year: 2010,
  languages: "en"
});
```

### Search by File Hash
```typescript
// First calculate the hash
const hashResult = await mcpClient.callTool("calculate_file_hash", {
  file_path: "/path/to/inception.mkv"
});

// Then search using the hash
await mcpClient.callTool("search_subtitles", {
  moviehash: "8e245d9679d31e12",
  moviebytesize: 12909756
});
```

### Search TV Show Episodes
```typescript
await mcpClient.callTool("search_subtitles", {
  parent_imdb_id: 944947, // Game of Thrones
  season_number: 1,
  episode_number: 5,
  languages: "en"
});
```

## Server Deployment (HTTP Mode)

Run the server once and let any MCP client connect to it over HTTP.

```bash
npm install
npm run build
PORT=1620 MCP_MODE=http node dist/index.js
```

Point your MCP client at `http://your-host:1620/mcp` and choose the **Streamable HTTP**
transport. The server needs no authentication of its own; an OpenSubtitles API key is
optional and configured server-side (see [Rate Limiting & API Keys](#rate-limiting--api-keys)).

### Environment

```bash
PORT=1620                                            # HTTP port
MCP_MODE=http                                        # http | stdio
OPENSUBTITLES_API_KEY=your_api_key_here              # optional, used for all requests
OPENSUBTITLES_API_BASE=https://api.opensubtitles.com # optional, override the API base
```

### Docker

```bash
docker-compose up -d opensubtitles
```

### Process manager

```bash
pm2 start dist/index.js --name opensubtitles-mcp --env MCP_MODE=http
```

### Verifying a deployment

```bash
curl https://your-host/health

curl -X POST https://your-host/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Direct HTTP API

Besides MCP, the server exposes `/proxy` for plain HTTP callers that do not speak the
protocol:

```bash
# Search subtitles
curl -X POST https://mcp.opensubtitles.com/proxy \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_subtitles", "arguments": {"query": "Matrix", "year": 1999}}'

# Download subtitle
curl -X POST https://mcp.opensubtitles.com/proxy \
  -H "Content-Type: application/json" \
  -d '{"tool": "download_subtitle", "arguments": {"file_id": 123456}}'
```

## Rate Limiting & API Keys

Search is unlimited. Downloads run against a quota, and without your own key that
quota is the small daily allowance of a shared built-in key, so downloads usually
fail. Getting your own is free: register at
[OpenSubtitles.com/api](https://www.opensubtitles.com/api).

There are three ways to use it - pick one, no config file editing required:

### 1. Tell the assistant (stdio mode)

Say "my OpenSubtitles API key is ..." and the assistant calls the `set_api_key`
tool. The key applies to the rest of the session; nothing is written to disk, so
after a restart you say it again. `set_api_key` also accepts `username` and
`password` instead, in which case the server logs in and reports your daily quota.

`api_key_status` tells you which credentials are in use, masked.

### 2. Environment variable (permanent)

```bash
OPENSUBTITLES_API_KEY=your_api_key_here
```

In a Claude Desktop / Claude Code config that is the `env` block of the server
entry; for a deployed server, the process environment or `docker-compose.yml`.

### 3. Per request (HTTP mode)

A hosted server can serve many people, each with their own quota:

```bash
curl -X POST https://your-host/mcp -H 'Api-Key: your_api_key_here' ...
```

`Authorization: Bearer <token>` works too, and `user_api_key` may be passed in the
tool arguments. Precedence: request argument or header → session key → environment
→ built-in shared key.

For safety `set_api_key` is only offered in stdio mode: on a shared HTTP server one
caller's key must not become the server's default.

## Development

### Prerequisites
- Node.js 18.0.0 or higher
- TypeScript

### Setup
```bash
git clone <repository>
cd mcp-opensubtitles
npm install
```

### Building
```bash
npm run build
```

### Development Commands
```bash
# HTTP Mode (Web Server)
npm run dev                # Build and run HTTP server on port 1620
npm start                  # Run built HTTP server

# Stdio Mode (Claude Desktop)
npm run dev:stdio          # Build and run stdio mode
npm run start:stdio        # Run built stdio mode

# Development with Auto-rebuild
npm run watch
```

### Testing
```bash
# For HTTP mode testing
curl http://localhost:1620/health        # Health check
curl http://localhost:1620/             # API info

# For Stdio mode testing
npm test                   # Run evaluation tests
npm run inspector          # Debug with MCP Inspector (stdio mode)

# MCP evaluation tests
npx mcp-eval evals/evals.ts dist/index.js
```

### Environment Variables
```bash
MCP_MODE=http                                         # http | stdio (default: stdio when piped)
PORT=1620                                             # HTTP mode only
OPENSUBTITLES_API_KEY=your_api_key_here               # Optional; OPENSUBTITLES_USER_KEY also accepted
OPENSUBTITLES_API_BASE=https://api.opensubtitles.com  # Default Kong gateway
NODE_ENV=production
```

## Architecture

The server uses a clean architecture with the following components:

- **MCP Server Core** (`src/server.ts`): Main MCP protocol implementation
- **Kong API Client** (`src/api-client.ts`): HTTP client for Kong gateway communication
- **Tools** (`src/tools/`): Individual tool implementations
- **Utilities** (`src/utils/`): Helper functions for hash calculation

All API requests go through the Kong gateway at `api.opensubtitles.com`, which handles:
- Rate limiting enforcement
- API key validation
- Request routing to OpenSubtitles API
- Error handling and responses

## Error Handling

The server provides helpful error messages for common scenarios:

- **Rate limit / quota exhausted**: the message from the API, followed by how to supply a
  key on this transport (`set_api_key` in stdio mode, `Api-Key:` header or
  `OPENSUBTITLES_API_KEY` in HTTP mode)
- **Invalid API key**: same, with the reason
- **File not found**: clear file path validation messages
- **Network errors**: descriptive network connectivity messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs and feature requests on GitHub
- **API Documentation**: [OpenSubtitles API Docs](https://opensubtitles.stoplight.io/docs/opensubtitles-api/e3750fd63a100-getting-started)
- **MCP Protocol**: [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
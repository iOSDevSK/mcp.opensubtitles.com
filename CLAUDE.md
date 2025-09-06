# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript/Node.js-based MCP (Model Context Protocol) server for OpenSubtitles API integration. The server provides subtitle search and download functionality with a freemium model, using the existing Kong gateway at api.opensubtitles.com for API management.

## Commands

### Development Commands
```bash
npm install                # Install dependencies
npm run build              # Build TypeScript to JavaScript
npm run watch              # Development with auto-rebuild
npm run dev                # Build and run the server
npm test                   # Run tests (currently placeholder)
npm run test:evals         # Run MCP evaluation tests (when implemented)
npm run inspector          # Debug with MCP Inspector
npm run prepublish         # Build before publishing
```

### Testing and Debugging
```bash
npx @modelcontextprotocol/inspector dist/index.js  # MCP Inspector for debugging
npx mcp-eval src/evals/evals.ts dist/index.js       # Run evaluation tests
```

## Architecture

### Core Structure (Planned)
- **MCP Server**: TypeScript implementation using @modelcontextprotocol/sdk
- **API Integration**: All requests go through Kong gateway (api.opensubtitles.com)
- **Rate Limiting**: Handled by Kong configuration
- **Deployment**: mcp.opensubtitles.com domain
- **Distribution**: NPM package @opensubtitles/mcp-server

### Planned Directory Structure
```
src/
├── index.ts               # Main MCP server entry point
├── server.ts              # MCP server implementation
├── api-client.ts          # Kong gateway client wrapper
├── tools/                 # MCP tool implementations
│   ├── search-subtitles.ts
│   ├── download-subtitle.ts
│   └── calculate-file-hash.ts
└── utils/                 # Helper functions
    ├── hash-calculator.ts
    └── subtitle-parser.ts
```

### MCP Tools to Implement

1. **search_subtitles**: Search with all OpenSubtitles API parameters (query, imdb_id, tmdb_id, moviehash, etc.)
2. **download_subtitle**: Download subtitle content (rate limited via Kong)
3. **calculate_file_hash**: Calculate OpenSubtitles hash for movie files

## Technical Details

### Dependencies
- @modelcontextprotocol/sdk - MCP TypeScript SDK
- axios - HTTP client for Kong gateway communication
- zod - Schema validation and type safety
- dotenv - Environment configuration
- crypto - File hashing (built-in Node.js)

### API Integration
- Base URL: https://api.opensubtitles.com (Kong gateway)
- VIP URL: https://vip-api.opensubtitles.com/api/v1 (for authenticated users)
- Rate limiting: Managed by Kong (unlimited search, limited downloads)
- Authentication: User API keys passed through Kong
- **Official API Specification**: Use `curl https://stoplight.io/api/v1/projects/opensubtitles/opensubtitles-api/nodes/open_api.json` for complete OpenAPI 3.0.3 specification

### Business Model
- Anonymous users: Unlimited search, 0 downloads
- API key users: Full OpenSubtitles API access
- Future premium: Server-side API key with higher limits

## Configuration

### Environment Variables
```
OPENSUBTITLES_API_BASE=https://api.opensubtitles.com
NODE_ENV=production
PORT=1620
```

### TypeScript Configuration
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Output directory: dist/

## Installation and Usage

### NPM Package Usage
```bash
npx @opensubtitles/mcp-server                    # Direct usage
npx @michaellatman/mcp-get@latest install @opensubtitles/mcp-server  # Via mcp-get
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "@opensubtitles/mcp-server"]
    }
  }
}
```

## Development Notes

- Complete TypeScript MCP server implementation with 3 tools
- Kong gateway handles all rate limiting and API management
- Use MCP Inspector for debugging (stdio communication)
- Follow security best practices for API key handling
- Supports both HTTP mode (port 1620) and stdio mode for Claude Desktop

### API Reference and Specifications

When working with the OpenSubtitles API, always refer to the official specification:

```bash
# Get complete OpenAPI 3.0.3 specification
curl https://stoplight.io/api/v1/projects/opensubtitles/opensubtitles-api/nodes/open_api.json
```

This specification includes:
- **Complete endpoint documentation** for all `/api/v1/*` endpoints
- **Request/response schemas** with exact parameter names and types
- **Authentication requirements** for both API keys and JWT tokens
- **Rate limiting information** and quota management
- **Error codes and responses** for proper error handling
- **Example requests/responses** for all endpoints

### Key API Endpoints Implemented

1. **POST /download**: Download subtitle files by `file_id`
   - Requires: `file_id` (from search results)
   - Optional: `sub_format`, `file_name`, `in_fps`, `out_fps`, `timeshift`, `force_download`
   - Authentication: Both `Api-Key` and `Authorization` headers required

2. **GET /subtitles**: Search for subtitles
   - Supports: `query`, `imdb_id`, `tmdb_id`, `parent_imdb_id`, `season_number`, `episode_number`, etc.
   - Rate limit: Unlimited for search operations

3. **POST /login**: Authenticate user to get JWT token
   - Returns: `base_url` (may redirect to VIP server), `token`, user info

## Publishing to NPM

To publish this package to NPM registry so users can use `npx @opensubtitles/mcp-server`:

### Prerequisites
1. Ensure you have NPM account with access to @opensubtitles organization
2. Login to NPM: `npm login`
3. Verify build works: `npm run build`

### Publishing Steps
```bash
# Ensure clean build
npm run build

# Test package locally
npm pack
tar -tf opensubtitles-mcp-server-1.0.0.tgz

# Publish to NPM
npm publish

# Verify publication
npm view @opensubtitles/mcp-server
```

### After Publishing
Users can then use:
```bash
npx @opensubtitles/mcp-server
```

And Claude Desktop config becomes:
```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "@opensubtitles/mcp-server"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

### Current Status
- ✅ Full TypeScript implementation complete
- ✅ HTTP server mode working on port 1620 
- ✅ stdio mode for Claude Desktop integration
- ✅ All three tools implemented (search, download, hash)
- ✅ Comprehensive error handling and logging
- ✅ ES module entry point fix applied (resolves Claude Desktop crashes)
- ✅ Keep-alive mechanisms for stable MCP connection
- ✅ Tested and working with Claude Desktop MCP integration
- ✅ Package ready for publication
- 🔄 NPM publishing pending (npmjs.com temporary issues)
- 📋 GitHub installation temporary workaround: `npx https://github.com/opensubtitles/mcp.opensubtitles.com.git`
- 🌐 HTTP server available at: https://mcp.opensubtitles.com

### Troubleshooting

#### Claude Desktop Integration Issues
If the MCP server crashes or doesn't connect properly with Claude Desktop:

1. **Check logs**: Look for MCP server logs in Claude Desktop's MCP log files
2. **ES Module Issues**: The fix has been applied - server now always calls main() instead of relying on ES module entry point detection
3. **Process Exit**: Keep-alive mechanisms are implemented to prevent premature process exit
4. **Debugging**: Use the simple test server at `dist/simple-index.js` for debugging basic MCP connectivity

#### GitHub Installation
Until NPM package is available:
```json
{
  "mcpServers": {
    "opensubtitles": {
      "command": "npx",
      "args": ["-y", "https://github.com/opensubtitles/mcp.opensubtitles.com.git"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```
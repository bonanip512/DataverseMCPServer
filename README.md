# Dataverse MCP Chatbot

A lightweight HTTP wrapper around a Model Context Protocol (MCP) server for Microsoft Power Platform/Dataverse. This project exposes a set of tools via a `/invoke` REST endpoint and includes a simple HTML chatbot UI that accepts natural-language queries and dynamically routes them to the appropriate MCP tool.

---

## Features

* **MCP Tools**: Supports 8 core MCP operations:

  1. `use-powerplatform-prompt` — Entity overview, attribute details, query templates, relationship maps
  2. `get-entity-metadata` — Fetch metadata for an entity
  3. `get-entity-attributes` — List all attributes of an entity
  4. `get-entity-attribute` — Retrieve a specific attribute definition
  5. `get-entity-relationships` — One-to-many and many-to-many relationships
  6. `get-global-option-set` — Global option set definitions
  7. `get-record` — Fetch a record by GUID
  8. `query-records` — OData-filtered record queries

* **Natural-Language Front End**: HTML + JavaScript UI that parses free-text questions and invokes the correct MCP tool.

* **Environment Configuration**: Uses environment variables for all Power Platform credentials.

* **Express + CORS**: Simple HTTP server for integration with any front-end.

---

## Prerequisites

* Node.js **>= 16.x**
* A Dataverse / Power Platform environment and service principal (app registration) with:

  * Tenant ID
  * Client (Application) ID
  * Client Secret
  * Organization URL (e.g. `https://<yourorg>.crm.dynamics.com`)

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/powerplatform-mcp-chatbot.git
   cd powerplatform-mcp-chatbot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the TypeScript**

   ```bash
   npm run build
   ```

---

## Configuration

Create a `.env` file in the project root (or set environment variables in your shell) with:

```dotenv
POWERPLATFORM_URL=https://yourorg.crm.dynamics.com
POWERPLATFORM_CLIENT_ID=your-client-id
POWERPLATFORM_CLIENT_SECRET=your-client-secret
POWERPLATFORM_TENANT_ID=your-tenant-id
PORT=3000           # Optional: HTTP server port
```

> **Note**: Ensure these values are kept secure and not committed to version control.

---

## Running the Server

After building, start the HTTP wrapper:

```bash
node dist/server.js
```

You should see:

```
✅ PowerPlatform MCP HTTP server running at http://localhost:3000/invoke
```

---

## REST Invoke Endpoint

All MCP tools are exposed via a single POST endpoint:

```
POST http://localhost:3000/invoke
Content-Type: application/json

{
  "tool": "tool-name",
  "parameters": { /* tool-specific parameters */ }
}
```

### Sample Requests

1. **Entity Overview**

   ```bash
   curl -X POST http://localhost:3000/invoke \
     -H 'Content-Type: application/json' \
     -d '{"tool":"use-powerplatform-prompt","parameters":{"promptType":"ENTITY_OVERVIEW","entityName":"account"}}'
   ```

2. **Get Entity Metadata**

   ```bash
   curl -X POST http://localhost:3000/invoke \
     -d '{"tool":"get-entity-metadata","parameters":{"entityName":"contact"}}'
   ```

3. **Query Records**

   ```bash
   curl -X POST http://localhost:3000/invoke \
     -d '{"tool":"query-records","parameters":{"entityNamePlural":"contacts","filter":"statecode eq 0","maxRecords":10}}'
   ```

Refer to the full tool list above for parameter details.

---

## HTML Chatbot UI

A demo front-end is provided in `chatbot.html`. It listens for natural-language queries, maps them to the correct tool, and displays results inline.

1. **Serve `chatbot.html`** (e.g., open directly in Chrome or host via any static server).
2. **Ask questions** such as:

   * “Tell me about the Account entity”
   * “List fields in Lead”
   * “Details of field revenue on Account”
   * “Find active contacts where statecode eq 0”

---

## Troubleshooting

* **CORS Errors**: Ensure you run the HTML from a local or hosted file with CORS enabled (the server uses `cors()` by default).
* **Authentication**: Verify your service principal has Dataverse API permissions and the environment URL is correct.
* **Errors**: Check console output from `server.js` for stack traces and error messages.



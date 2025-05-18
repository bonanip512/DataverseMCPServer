// server.ts — HTTP-based wrapper for MCP tools with Power Platform support
import express from 'express';
import bodyParser from 'body-parser';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PowerPlatformService, PowerPlatformConfig } from './Dataverse.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const POWERPLATFORM_CONFIG: PowerPlatformConfig = {
  organizationUrl: '',
  clientId: '',
  clientSecret: '',
  tenantId: '',
};

const service = new PowerPlatformService(POWERPLATFORM_CONFIG);
const toolHandlers: Record<string, Function> = {};
const server = new McpServer({ name: 'powerplatform-mcp', version: '1.0.0' });

// 1. use-powerplatform-prompt
const usePromptHandler = async ({ promptType, entityName }: { promptType: 'ENTITY_OVERVIEW'; entityName: string }) => {
  const metadata = await service.getEntityMetadata(entityName);
  const attributes = await service.getEntityAttributes(entityName);
  const relationships = await service.getEntityRelationships(entityName);
  const details = `## Power Platform Entity: ${entityName}

### Entity Details
- Display Name: ${metadata.DisplayName?.UserLocalizedLabel?.Label || entityName}
- Schema Name: ${metadata.SchemaName}
- Description: ${metadata.Description?.UserLocalizedLabel?.Label || 'N/A'}
- Primary Key: ${metadata.PrimaryIdAttribute}
- Primary Name: ${metadata.PrimaryNameAttribute}

### Key Attributes
${attributes.value.map(attr => `- ${attr.LogicalName}`).join('\n')}

### Relationships
- One-to-Many Relationships: ${relationships.oneToMany.value.length}
- Many-to-Many Relationships: ${relationships.manyToMany.value.length}`;
  return { content: [{ type: 'text', text: details } as const] };
};
server.tool(
  'use-powerplatform-prompt',
  'Use a predefined prompt for entity overview',
  { promptType: z.enum(['ENTITY_OVERVIEW']), entityName: z.string() },
  usePromptHandler
);
toolHandlers['use-powerplatform-prompt'] = usePromptHandler;

// 2. get-entity-metadata
const getEntityMetadataHandler = async ({ entityName }: { entityName: string }) => {
  const metadata = await service.getEntityMetadata(entityName);
  return { content: [{ type: 'text', text: JSON.stringify(metadata, null, 2) } as const] };
};
server.tool(
  'get-entity-metadata',
  'Get metadata for a Dataverse entity',
  { entityName: z.string() },
  getEntityMetadataHandler
);
toolHandlers['get-entity-metadata'] = getEntityMetadataHandler;

// 3. get-entity-attributes
const getEntityAttributesHandler = async ({ entityName }: { entityName: string }) => {
  const attributes = await service.getEntityAttributes(entityName);
  return { content: [{ type: 'text', text: JSON.stringify(attributes, null, 2) } as const] };
};
server.tool(
  'get-entity-attributes',
  'Get all attributes for a Dataverse entity',
  { entityName: z.string() },
  getEntityAttributesHandler
);
toolHandlers['get-entity-attributes'] = getEntityAttributesHandler;

// 4. get-entity-attribute
const getEntityAttributeHandler = async ({ entityName, attributeName }: { entityName: string; attributeName: string }) => {
  const attribute = await service.getEntityAttribute(entityName, attributeName);
  return { content: [{ type: 'text', text: JSON.stringify(attribute, null, 2) } as const] };
};
server.tool(
  'get-entity-attribute',
  'Get a specific attribute from an entity',
  { entityName: z.string(), attributeName: z.string() },
  getEntityAttributeHandler
);
toolHandlers['get-entity-attribute'] = getEntityAttributeHandler;

// 5. get-entity-relationships
const getEntityRelationshipsHandler = async ({ entityName }: { entityName: string }) => {
  const relationships = await service.getEntityRelationships(entityName);
  return { content: [{ type: 'text', text: JSON.stringify(relationships, null, 2) } as const] };
};
server.tool(
  'get-entity-relationships',
  'Get all relationships for a Dataverse entity',
  { entityName: z.string() },
  getEntityRelationshipsHandler
);
toolHandlers['get-entity-relationships'] = getEntityRelationshipsHandler;

// 6. get-global-option-set
const getGlobalOptionSetHandler = async ({ optionSetName }: { optionSetName: string }) => {
  const optionSet = await service.getGlobalOptionSet(optionSetName);
  return { content: [{ type: 'text', text: JSON.stringify(optionSet, null, 2) } as const] };
};
server.tool(
  'get-global-option-set',
  'Get a global option set by name',
  { optionSetName: z.string() },
  getGlobalOptionSetHandler
);
toolHandlers['get-global-option-set'] = getGlobalOptionSetHandler;

// 7. get-record
const getRecordHandler = async ({ entityNamePlural, recordId }: { entityNamePlural: string; recordId: string }) => {
  const record = await service.getRecord(entityNamePlural, recordId);
  return { content: [{ type: 'text', text: JSON.stringify(record, null, 2) } as const] };
};
server.tool(
  'get-record',
  'Get a record by ID',
  { entityNamePlural: z.string(), recordId: z.string() },
  getRecordHandler
);
toolHandlers['get-record'] = getRecordHandler;

// 8. query-records
const queryRecordsHandler = async ({ entityNamePlural, filter, maxRecords }: { entityNamePlural: string; filter: string; maxRecords?: number }) => {
  const results = await service.queryRecords(entityNamePlural, filter, maxRecords || 50);
  return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) } as const] };
};
server.tool(
  'query-records',
  'Query Dataverse records with OData filter',
  { entityNamePlural: z.string(), filter: z.string(), maxRecords: z.number().optional() },
  queryRecordsHandler
);
toolHandlers['query-records'] = queryRecordsHandler;

// HTTP invoke endpoint
app.post('/invoke', async (req: Request, res: Response): Promise<void> => {
  const { tool, parameters } = req.body;
  const handler = toolHandlers[tool];
  if (!handler) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  try {
    const result = await handler(parameters);
    res.json({ output: result.content[0]?.text || 'No output.' });
  } catch (err: any) {
    console.error('Invoke error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Dataverse MCP HTTP server running at http://localhost:${PORT}/invoke`);
});

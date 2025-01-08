#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrieveAndGenerateCommandInput,
} from "@aws-sdk/client-bedrock-agent-runtime";

// Required AWS environment variables for the server to function
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',      // AWS access key for authentication
  'AWS_SECRET_ACCESS_KEY',  // AWS secret key for authentication
  'AWS_REGION',            // AWS region where the Knowledge Base is located
  'AWS_KNOWLEDGE_BASE_ID', // ID of the Knowledge Base to query
  'AWS_INFERENCE_PROFILE_ARN', // ARN of the inference profile to use
] as const;

/**
 * Validates that all required environment variables are present
 * @throws {Error} If any required environment variable is missing
 */
function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `- ${v}`).join('\n')}`
    );
  }
}

/**
 * Interface for the query_knowledge_base tool parameters
 */
interface QueryKnowledgeBaseParams {
  query: string;
  context?: string;
  temperature?: number;
}

/**
 * Main server class that handles AWS Bedrock Knowledge Base interactions
 */
class AWSKnowledgeBaseServer {
  private server: Server;
  private bedrockAgentClient: BedrockAgentRuntimeClient;

  constructor() {
    // Validate environment before initializing
    validateEnvironment();

    this.server = new Server(
      {
        name: 'aws-kb',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize AWS Bedrock client
    this.bedrockAgentClient = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Sets up error handling for the server
   */
  private setupErrorHandling() {
    this.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('Unhandled Promise Rejection:', reason);
    });
  }

  /**
   * Configures the available tools for the MCP server
   */
  private setupToolHandlers() {
    // Register available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'query_knowledge_base',
          description: 'Query the AWS Bedrock Knowledge Base to retrieve and generate relevant information',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The question or query to ask the knowledge base',
              },
              context: {
                type: 'string',
                description: 'Optional context or background information to help inform the query',
              },
              temperature: {
                type: 'number',
                description: 'Optional temperature parameter for response generation (0.0 to 1.0)',
                minimum: 0,
                maximum: 1,
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      if (request.params.name !== 'query_knowledge_base') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      return await this.handleKnowledgeBaseQuery(request.params.arguments);
    });
  }

  /**
   * Handles knowledge base query execution
   * @param params Query parameters
   * @returns Generated response from the knowledge base
   */
  private async handleKnowledgeBaseQuery(params: unknown) {
    const { query, context, temperature = 0.7 } = params as QueryKnowledgeBaseParams;

    if (!query) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Query parameter is required'
      );
    }

    try {
      const prompt = context 
        ? `Context: ${context}\n\nQuestion: ${query}`
        : query;

      const input: RetrieveAndGenerateCommandInput = {
        input: {
          text: prompt,
        },
        retrieveAndGenerateConfiguration: {
          type: "KNOWLEDGE_BASE",
          knowledgeBaseConfiguration: {
            knowledgeBaseId: process.env.AWS_KNOWLEDGE_BASE_ID!,
            modelArn: process.env.AWS_INFERENCE_PROFILE_ARN!,
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: 5,
              },
            },
            generationConfiguration: {
              inferenceConfig: {
                textInferenceConfig: {
                  temperature,
                  maxTokens: 2048,
                  topP: 0.9,
                  stopSequences: [],
                },
              },
            },
          },
        },
      };

      const command = new RetrieveAndGenerateCommand(input);
      const response = await this.bedrockAgentClient.send(command);
      
      const generatedText = response.output?.text || 'No response generated';

      return {
        content: [
          {
            type: 'text',
            text: generatedText,
          },
        ],
      };
    } catch (error) {
      console.error('Error querying knowledge base:', error);
      
      // Provide more detailed error information
      const errorMessage = error instanceof Error 
        ? error.message
        : 'Unknown error occurred';

      return {
        content: [
          {
            type: 'text',
            text: `Error querying knowledge base: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Starts the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AWS Knowledge Base MCP server running on stdio');
  }
}

// Start the server
const server = new AWSKnowledgeBaseServer();
server.run().catch(console.error);

# aws-kb

A Model Context Protocol (MCP) server that enables querying AWS Bedrock Knowledge Bases. This server allows AI assistants to access and query your AWS Bedrock Knowledge Base through a standardized interface.

[![npm version](https://badge.fury.io/js/aws-kb.svg)](https://www.npmjs.com/package/aws-kb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Query AWS Bedrock Knowledge Bases using natural language
- Support for context-aware queries
- Configurable response generation parameters
- Easy integration with MCP-compatible AI assistants

## Installation

```bash
# Install globally
npm install -g aws-kb

# Or install as a project dependency
npm install aws-kb
```

## Prerequisites

- Node.js >= 18.0.0
- An AWS account with Bedrock access
- A configured AWS Bedrock Knowledge Base
- AWS credentials with appropriate permissions

## Configuration

The server requires the following environment variables to be set:

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | The AWS region where your Knowledge Base is located |
| `AWS_KNOWLEDGE_BASE_ID` | The ID of your Knowledge Base |
| `AWS_INFERENCE_PROFILE_ARN` | The ARN of the inference profile to use |

You can set these environment variables in your shell:

```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="your_region"
export AWS_KNOWLEDGE_BASE_ID="your_kb_id"
export AWS_INFERENCE_PROFILE_ARN="your_profile_arn"
```

Or create a `.env` file in your project:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_KNOWLEDGE_BASE_ID=your_kb_id
AWS_INFERENCE_PROFILE_ARN=your_profile_arn
```

## Usage

### As a Command Line Tool

When installed globally, you can run the server directly:

```bash
aws-kb
```

### As a Module

```javascript
import { AWSKnowledgeBaseServer } from 'aws-kb';

const server = new AWSKnowledgeBaseServer();
server.run().catch(console.error);
```

### Using with Claude

1. Add the server configuration to your Claude settings:

```json
{
  "mcpServers": {
    "aws-kb": {
      "command": "aws-kb",
      "env": {
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key",
        "AWS_REGION": "your_region",
        "AWS_KNOWLEDGE_BASE_ID": "your_kb_id",
        "AWS_INFERENCE_PROFILE_ARN": "your_profile_arn"
      }
    }
  }
}
```

2. The server provides a `query_knowledge_base` tool that accepts the following parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The question or query to ask |
| `context` | string | No | Additional context to help inform the query |
| `temperature` | number | No | Temperature parameter for response generation (0.0 to 1.0) |

### Example Usage

```javascript
// Example query to send to the server
const query = {
  jsonrpc: '2.0',
  id: 1,
  method: 'callTool',
  params: {
    name: 'query_knowledge_base',
    arguments: {
      query: 'What is AWS Bedrock?',
      context: 'I am new to AWS services',
      temperature: 0.7
    }
  }
};

// Send the query to the server
server.stdin.write(JSON.stringify(query) + '\n');
```

For more examples, check out the [examples](./examples) directory.

## Development

To build from source:

```bash
git clone https://github.com/assaads/aws-kb.git
cd aws-kb
npm install
npm run build
```

### Testing

You can use the MCP Inspector to test the server locally:

```bash
npm run inspector
```

### Scripts

- `npm run build` - Build the TypeScript source
- `npm run watch` - Watch for changes and rebuild
- `npm start` - Run the server
- `npm run inspector` - Run the MCP inspector for testing

## API Reference

### Server Configuration

The server can be configured through environment variables and constructor options:

```typescript
interface ServerConfig {
  name?: string;
  version?: string;
  capabilities?: {
    tools?: Record<string, unknown>;
  };
}

const server = new AWSKnowledgeBaseServer({
  name: 'custom-name',
  version: '1.0.0'
});
```

### Query Parameters

```typescript
interface QueryParams {
  query: string;
  context?: string;
  temperature?: number;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [Model Context Protocol](https://github.com/docker/mcp)
- [Claude](https://github.com/anthropics/claude)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)

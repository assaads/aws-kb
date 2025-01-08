// Example script demonstrating how to use the AWS Knowledge Base MCP server
// Run this with: node examples/basic-usage.js

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'build', 'index.js');

// Start the MCP server
const server = spawn('node', [serverPath], {
  env: {
    ...process.env,
    // Add your AWS credentials and configuration here
    AWS_ACCESS_KEY_ID: 'your_access_key',
    AWS_SECRET_ACCESS_KEY: 'your_secret_key',
    AWS_REGION: 'your_region',
    AWS_KNOWLEDGE_BASE_ID: 'your_kb_id',
    AWS_INFERENCE_PROFILE_ARN: 'your_profile_arn',
  },
});

// Example query to send to the server
const query = {
  jsonrpc: '2.0',
  id: 1,
  method: 'callTool',
  params: {
    name: 'query_knowledge_base',
    arguments: {
      query: 'What is AWS Bedrock?',
      temperature: 0.7
    }
  }
};

// Send the query to the server
server.stdin.write(JSON.stringify(query) + '\n');

// Handle server output
server.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('Response from server:', response);
    
    // Close the server after getting the response
    server.kill();
  } catch (error) {
    console.error('Error parsing server response:', error);
  }
});

// Handle server errors
server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Handle server exit
server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

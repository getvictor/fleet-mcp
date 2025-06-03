import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple test client for the Fleet MCP server
 */
async function testMcpServer(): Promise<void> {
  const port = process.env.PORT || '3000';
  const baseUrl = `http://localhost:${port}/mcp`;
  const authToken = process.env.MCP_AUTH_TOKEN || 'test-token';
  
  // Configure axios with authorization header
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  try {
    // Test server metadata
    console.log('Testing server metadata...');
    const metadataResponse = await axios.get(baseUrl, axiosConfig);
    console.log('Server metadata:', metadataResponse.data);
    console.log('---\n');
    
    // Test listing tools
    console.log('Testing tool listing...');
    const toolsResponse = await axios.get(`${baseUrl}/tools`, axiosConfig);
    console.log('Available tools:', toolsResponse.data.tools.map((t: any) => t.name));
    console.log('---\n');
    
    // Test calling a tool
    console.log('Testing tool execution...');
    const toolCallResponse = await axios.post(`${baseUrl}/tools/query_devices/call`, {
      arguments: {
        platform: 'macOS',
        limit: 2
      }
    }, axiosConfig);
    console.log('Tool execution result:');
    console.log(toolCallResponse.data.content[0].text);
    console.log('---\n');
    
    // Test listing resources
    console.log('Testing resource listing...');
    const resourcesResponse = await axios.get(`${baseUrl}/resources`, axiosConfig);
    console.log('Available resources:', resourcesResponse.data.resources.map((r: any) => r.uri));
    console.log('---\n');
    
    // Test reading a resource
    console.log('Testing resource reading...');
    const resourceReadResponse = await axios.get(`${baseUrl}/resources/read?uri=${encodeURIComponent('fleet://devices/summary')}`, axiosConfig);
    console.log('Resource content:');
    console.log(resourceReadResponse.data.contents[0].text);
    console.log('---\n');
    
    console.log('All tests completed successfully!');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Make sure MCP_AUTH_TOKEN is set correctly in your .env file.');
    } else {
      console.error('Error testing MCP server:', error.message);
    }
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testMcpServer();
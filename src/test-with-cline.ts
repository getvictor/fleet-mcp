import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to test the Fleet MCP server with Cline/Roo Code
 */
async function testWithCline(): Promise<void> {
  try {
    console.log('Testing Fleet MCP Server with Cline/Roo Code');
    console.log('==========================================');
    
    // Check if the server is running
    console.log('Checking if the Fleet MCP server is running...');
    const port = process.env.PORT || '3000';
    try {
      const response = await fetch(`http://localhost:${port}/mcp`);
      if (response.ok) {
        console.log('✅ Fleet MCP server is running');
      } else {
        console.log('❌ Fleet MCP server is running but returned an error');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Please check the server logs for more information');
        return;
      }
    } catch (error) {
      console.log('❌ Fleet MCP server is not running');
      console.log('Please start the server with: npm start');
      return;
    }
    
    // Check if the MCP server is configured in Cline/Roo Code
    console.log('\nChecking if the Fleet MCP server is configured in Cline...');
    
    // Determine the user's home directory
    const homeDir = os.homedir();
    
    // Path to Cline config file
    const clineConfigPath = path.join(
      homeDir,
      'Library',
      'Application Support',
      'Code',
      'User',
      'globalStorage',
      'rooveterinaryinc.roo-cline',
      'settings',
      'mcp_settings.json'
    );
    
    // Path to Roo Code config file
    const rooCodeConfigPath = path.join(
      homeDir,
      'Library',
      'Application Support',
      'Roo Code',
      'globalStorage',
      'rooveterinaryinc.roo-cline',
      'settings',
      'mcp_settings.json'
    );
    
    if (fs.existsSync(clineConfigPath)) {
      try {
        const configContent = fs.readFileSync(clineConfigPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        if (config.mcpServers && config.mcpServers.fleet) {
          console.log('✅ Fleet MCP server is configured in Cline');
          
          if (config.mcpServers.fleet.disabled) {
            console.log('⚠️ Warning: Fleet MCP server is disabled in Cline');
            console.log('To enable it, run: npm run install-mcp');
          } else {
            console.log('✅ Fleet MCP server is enabled in Cline');
          }
        } else {
          console.log('❌ Fleet MCP server is not configured in Cline');
          console.log('To configure it, run: npm run install-mcp');
        }
      } catch (error) {
        console.log('❌ Error reading Cline configuration');
        console.log('To configure the Fleet MCP server, run: npm run install-mcp');
      }
    } else {
      console.log('❌ Cline configuration file not found');
      console.log('Is Cline installed? If yes, run: npm run install-mcp');
    }
    
    // Check if the MCP server is configured in Roo Code
    console.log('\nChecking if the Fleet MCP server is configured in Roo Code...');
    try {
      if (fs.existsSync(rooCodeConfigPath)) {
        try {
          const configContent = fs.readFileSync(rooCodeConfigPath, 'utf-8');
          const config = JSON.parse(configContent);
          
          if (config.mcpServers && config.mcpServers.fleet) {
            console.log('✅ Fleet MCP server is configured in Roo Code');
            
            if (config.mcpServers.fleet.disabled) {
              console.log('⚠️ Warning: Fleet MCP server is disabled in Roo Code');
              console.log('To enable it, run: npm run install-mcp');
            } else {
              console.log('✅ Fleet MCP server is enabled in Roo Code');
            }
          } else {
            console.log('❌ Fleet MCP server is not configured in Roo Code');
            console.log('To configure it, run: npm run install-mcp');
          }
        } catch (error) {
          console.log('❌ Error reading Roo Code configuration');
          console.log('To configure the Fleet MCP server, run: npm run install-mcp');
        }
      } else {
        console.log('❌ Roo Code configuration file not found');
        console.log('Running npm run install-mcp will create the necessary configuration');
        console.log('Configuration will be created at:');
        console.log(rooCodeConfigPath);
      }
    } catch (error) {
      console.log('❌ Error checking Roo Code configuration');
      console.log(`Error details: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Provide instructions for testing with Cline/Roo Code
    console.log('\nTo test the Fleet MCP server:');
    console.log('1. Open VS Code with the Cline extension or Roo Code');
    console.log('2. Start a new conversation');
    console.log('3. Ask to use the Fleet MCP server, for example:');
    console.log('   "Show me a summary of all devices managed by Fleet"');
    console.log('   "Query devices running macOS"');
    console.log('   "List all policies in Fleet"');
  } catch (error) {
    console.error('Error testing with Cline/Roo Code:', error);
  }
}

// Run the test
testWithCline();